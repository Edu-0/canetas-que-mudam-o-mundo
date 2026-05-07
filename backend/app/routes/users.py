from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks, status
from app.schemas import user as s
from app.core.security import gerar_hash_senha
from app.core.deps_auth import VerificarPermissao, get_current_user
from app.models import user as m
from app.database.connection import SessionDep
from typing import List
from app.core.enums import TipoUsuario, BeneficiosUsuario
from fastapi import HTTPException
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError
from app.services.firebase_storage import FirebaseStorageService
from app.services.user_service import anonimizar_responsavel, processar_exclusao_conta, remover_funcao_responsavel
from datetime import date, datetime
import logging
from app.core.deps_auth import VerificarPermissao, get_current_user
from app.core.enums import TipoUsuario
import json


router = APIRouter(prefix="/usuario", tags=["usuario"])


def _excluir_arquivo_firebase_background(file_url: str) -> None:
    try:
        FirebaseStorageService.delete_file(file_url)
    except Exception as erro_firebase:
        logging.error(f"Erro ao excluir arquivo no Firebase em background: {erro_firebase}")


@router.get("/", response_model=List[s.respostaUsuario])
def get_usuarios(
    db:SessionDep, 
    permissao = Depends(VerificarPermissao("usuario:ver_todos"))):
    usuarios = db.query(m.Usuario).all()
    return usuarios   

@router.get("/perfil/me", response_model=s.respostaUsuario)
def get_perfil(
    db: SessionDep,
    usuario_atual: m.Usuario = Depends(get_current_user), 
    ):
    return usuario_atual

@router.delete("/deletar-conta/{usuario_id}")
def deletar_conta(
    usuario_id: int,
    db: SessionDep,
    usuario_atual: m.Usuario = Depends(get_current_user)
):  
    if usuario_atual.id != usuario_id:
        raise HTTPException(status_code=403, detail="Você só pode excluir a sua própria conta.")

    try:
        processar_exclusao_conta(usuario_id,db)

        return {"mensagem": "Conta excluída com sucesso."}

    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        db.rollback()
        print(f"Erro ao deletar: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao tentar remover usuário.")


""" Usuário """ 

@router.get("/{usuario_id}", response_model=s.respostaUsuario)
def get_usuario(usuario_id,db:SessionDep):
    usuario = db.get(m.Usuario,usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return usuario

@router.post("/generico", response_model=s.respostaUsuario)
def criar_usuario_base(dados:s.criarUsuario, db:SessionDep):
    hash_senha = gerar_hash_senha(dados.senha)
    agora = datetime.now()

    usuario = m.Usuario(
        nome_completo = dados.nome_completo,
        data_nascimento = dados.data_nascimento,
        cpf = dados.cpf,
        cep = dados.cep,
        telefone = dados.telefone,
        email = dados.email,
        senha = hash_senha,
        ativo = True,
        data_cadastro = agora,
        data_edicao_conta = agora
    )

    try:
        db.add(usuario)
        db.flush()

        funcao = m.UsuarioFuncao(
            usuario_id = usuario.id,
            tipo_usuario = dados.funcao
        )

        db.add(funcao)
        db.commit()
        db.refresh(usuario)
        
        return usuario

    except IntegrityError as e:
        db.rollback() # Cancela qualquer alteração para não deixar o banco "sujo"
        erro = str(e.orig).lower()

        if "cpf" in erro:
            raise HTTPException(
                status_code=400,
                detail={"campo": "cpf", "mensagem": "Este CPF já está cadastrado."}
            )

        if "email" in erro:
            raise HTTPException(
                status_code=400,
                detail={"campo": "email", "mensagem": "Este e-mail já está cadastrado."}
            )

        raise HTTPException(
            status_code=400,
            detail={"campo": "geral", "mensagem": "Erro ao cadastrar usuário."}
        )

@router.put("/{usuario_id}", response_model=s.respostaUsuario)
def atualizar_usuario(
    usuario_id, 
    dados:s.atualizarUsuario, 
    db:SessionDep, 
    permissao = Depends(VerificarPermissao("usuario:atualizar"))):
    usuario = db.get(m.Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    try:
        for key, value in dados.model_dump(exclude_unset=True).items():
            setattr(usuario, key, value)
        db.commit()
        db.refresh(usuario)
        return usuario

    except IntegrityError as e:
        db.rollback()
        erro = str(e.orig).lower()

        if "cpf" in erro:
            raise HTTPException(
                status_code=400,
                detail={
                    "campo": "cpf",
                    "mensagem": "Este CPF já está sendo utilizado por outro usuário."
                }
            )

        if "email" in erro:
            raise HTTPException(
                status_code=400,
                detail={
                    "campo": "email",
                    "mensagem": "Este e-mail já está sendo utilizado por outro usuário."
                }
            )

        raise HTTPException(
            status_code=400,
            detail={
                "campo": "geral",
                "mensagem": "Erro ao atualizar usuário."
            }
        )

""" Responsável """

@router.post("/{usuario_id}/responsavel", response_model=s.respostaUsuarioResponsavel)
def criar_usuario_responsavel(
    usuario_id: int, 
    db: SessionDep,
    qtd_familiares: int = Form(...),
    renda: float = Form(...),
    auxilio:BeneficiosUsuario = Form(...),
    concordou_termos: bool = Form(...),
    tipo_documento: str = Form(...),
    file: UploadFile = File(...),
    permissao = Depends(VerificarPermissao("usuario_responsavel:criar"))
):
    url = None 
    
    try:
        usuario = db.query(m.UsuarioResponsavel).filter(
            m.UsuarioResponsavel.responsavel_id == usuario_id
        ).first()

        if usuario:
            usuario.qtd_familiares = qtd_familiares
            usuario.renda = renda
            usuario.auxilio = auxilio
            usuario.concordou_termos = concordou_termos
            usuario.documentacao_aprovada = False
            usuario.ativo = True
            usuario.data_edicao_conta = datetime.now()
        else:
            usuario = m.UsuarioResponsavel(
                responsavel_id = usuario_id,
                qtd_familiares = qtd_familiares,
                renda = renda,
                auxilio = auxilio,
                concordou_termos = concordou_termos,
                ativo = True
            )

            db.add(usuario)
            db.flush() 

        url = FirebaseStorageService.upload_file(file)

        documentacao = m.DocumentoUsuario(
            responsavel_id = usuario.id, 
            tipo_documento = tipo_documento,
            nome_original = file.filename,
            caminho_arquivo = url
        )

        db.add(documentacao)
        
        funcao = m.UsuarioFuncao(
            usuario_id = usuario_id,
            tipo_usuario = TipoUsuario.RESPONSAVEL_BENEFICIARIO
        )

        funcao_existente = db.query(m.UsuarioFuncao).filter(
            m.UsuarioFuncao.usuario_id == usuario_id,
            m.UsuarioFuncao.tipo_usuario == TipoUsuario.RESPONSAVEL_BENEFICIARIO
        ).first()

        if not funcao_existente:
            db.add(funcao)
        
        db.commit()
        db.refresh(usuario)
        return usuario
        
    except Exception as e:
        db.rollback() 
        if url: 
            try:
                FirebaseStorageService.delete_file(url)
            except Exception as erro_firebase:
                logging.error(f"Erro ao apagar arquivo órfão no Firebase: {erro_firebase}")
                
        raise HTTPException(
            status_code=400, 
            detail=f"Erro ao cadastrar responsável: {str(e)}"
        )

@router.put("/{perfil_id}/responsavel", response_model=s.respostaUsuarioResponsavel)
def atualizar_usuario_responsavel(perfil_id, 
    dados:s.atualizarUsuarioResponsavel, 
    db:SessionDep, 
    permissao = Depends(VerificarPermissao("usuario_responsavel:atualizar"))):
    perfil = db.get(m.UsuarioResponsavel, perfil_id)
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil de beneficiário não encontrado.")
    for key, value in dados.model_dump(exclude_unset=True).items():
        setattr(perfil, key, value)
    perfil.usuario.data_edicao_conta = datetime.now()
    try:
        db.commit()
        db.refresh(perfil)
        return perfil
    except Exception as e:
        db.rollback()
        
        raise HTTPException(status_code=500, detail="Erro ao atualizar.")

@router.post("/{responsavel_id}/documentacao", response_model=s.cadastrarDocumento)
def upload_documento_responsavel(
    responsavel_id, 
    db:SessionDep,
    tipo_documento:str = Form(...),
    file: UploadFile = File(...),
    permissao = Depends(VerificarPermissao("documento_usuario:criar"))
    ):

    url = FirebaseStorageService.upload_file(file)

    documentacao = m.DocumentoUsuario(
        responsavel_id = responsavel_id,
        tipo_documento = tipo_documento,
        nome_original = file.filename,
        caminho_arquivo = url
    )
    try:
        db.add(documentacao)
        db.commit()
        db.refresh(documentacao)
    except Exception as e:
        db.rollback()
        try:
            FirebaseStorageService.delete_file(url)
        except Exception as erro_firebase:
            logging.error(f"ALERTA: Arquivo órfão criado no Firebase na url {url}. Erro: {erro_firebase}")
        raise HTTPException(  
        status_code=500,
        detail="Erro ao registrar documento."
        )    
    return documentacao

@router.get("/{responsavel_id}/documentacao", response_model=List[s.cadastrarDocumento])
def buscar_documentos_responsavel(
    responsavel_id: int, 
    db: SessionDep,
    permissao = Depends(VerificarPermissao("documento_usuario:listar"))
):
    documentos = db.query(m.DocumentoUsuario).filter(
        m.DocumentoUsuario.responsavel_id == responsavel_id,
        m.DocumentoUsuario.pendente_exclusao.is_(False)
    ).all()
    
    if not documentos:
        raise HTTPException(status_code=404, detail="Nenhum documento encontrado para este responsável.")
        
    return documentos

@router.delete("/documentacao/{documento_id}", status_code=status.HTTP_202_ACCEPTED)
def deletar_documento_usuario(
    documento_id: int, 
    background_tasks: BackgroundTasks,
    db: SessionDep,
    permissao = Depends(VerificarPermissao("documento_usuario:deletar"))
):
    documentacao = db.get(m.DocumentoUsuario, documento_id)
    
    if not documentacao or documentacao.pendente_exclusao:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    caminho_arquivo = documentacao.caminho_arquivo

    try:
        documentacao.pendente_exclusao = True
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao remover registro do banco.")    

    background_tasks.add_task(_excluir_arquivo_firebase_background, caminho_arquivo)

    return {"mensagem": "Documento marcado para exclusão com sucesso."}


""" Familiares """

@router.get("/familia/all", response_model = List[s.respostaFamiliaResponsavel])
def get_familiares(
    db:SessionDep,
    usuario_atual: m.Usuario = Depends(get_current_user),
    permissao = Depends(VerificarPermissao("familia_responsavel:listar"))):
    familiares = db.query(m.FamiliaResponsavel).filter(
        m.FamiliaResponsavel.responsavel_id == usuario_atual.id,
        m.FamiliaResponsavel.ativo.is_(True)
    ).all()
    if not familiares:
        return []
    return familiares


@router.post("/{responsavel_id}/familia-responsavel", response_model=List[s.respostaFamiliaResponsavel])
def cadastrar_familia_responsavel(
    responsavel_id: int, 
    db: SessionDep, 
    dados_familiares: str = Form(...), 
    arquivos: List[UploadFile] = File([]),
    permissao = Depends(VerificarPermissao("familia_responsavel:criar"))
):
    urls_geradas = [] 

    try:
        try:
            lista_dicts = json.loads(dados_familiares)
            dados = [s.cadastrarFamiliaResponsavel(**item) for item in lista_dicts]
        except Exception as e:
            print("==== ERRO DE VALIDAÇÃO PYDANTIC ====")
            print(e)
            print("====================================")
            raise ValueError(f"O formato dos dados dos familiares é inválido. Detalhe: {str(e)}")

        cpfs_enviados = [membro.cpf for membro in dados]
        cpfs_repetidos_no_payload = {cpf for cpf in cpfs_enviados if cpfs_enviados.count(cpf) > 1}
        if cpfs_repetidos_no_payload:
            raise ValueError("Há CPFs duplicados na lista de familiares enviada.")

        cpfs_existentes = db.query(m.FamiliaResponsavel.cpf).filter(
            m.FamiliaResponsavel.responsavel_id == responsavel_id,
            m.FamiliaResponsavel.cpf.in_(cpfs_enviados)
        ).all()

        if cpfs_existentes:
            raise ValueError("Um ou mais familiares já estão cadastrados para este responsável (CPF duplicado).")

        familiares = []
        for membro in dados:
            novo_familiar = m.FamiliaResponsavel(
                responsavel_id = responsavel_id, 
                nome = membro.nome,
                cpf = membro.cpf,
                parentesco = membro.parentesco,
                data_nascimento = membro.data_nascimento,
                renda = membro.renda,
                beneficiario = membro.beneficiario,
                ativo = True
            )
            familiares.append(novo_familiar)

        db.add_all(familiares)
        db.flush() 

        documentos = []
        for index, file in enumerate(arquivos):
            if file and file.filename: 
                url = FirebaseStorageService.upload_file(file)
                urls_geradas.append(url)
                
                novo_doc = m.DocumentoFamilia(
                    familiar_id = familiares[index].id, 
                    tipo_documento = "COMPROVANTE", 
                    nome_original = file.filename,
                    caminho_arquivo = url
                )
                documentos.append(novo_doc)

        db.add_all(documentos)
        db.commit()

        for familiar in familiares:
            db.refresh(familiar)
            
        return familiares

    except Exception as e:
        db.rollback()
        
        for url in urls_geradas:
            try:
                FirebaseStorageService.delete_file(url)
            except Exception as erro_firebase:
                logging.error(f"Erro ao deletar arquivo órfão: {erro_firebase}")
                
        if isinstance(e, IntegrityError):
            raise HTTPException(status_code=400, detail=f"Erro de integridade no banco: {str(e.orig)}")
            
        raise HTTPException(status_code=400, detail=f"Erro ao cadastrar: {str(e)}")

@router.put("/{familia_id}/familia-responsavel", response_model=s.respostaFamiliaResponsavel)
def atualizar_familia_responsavel(
    familia_id, 
    dados:s.atualizarFamiliaResponsavel, 
    db:SessionDep, 
    permissao = Depends(VerificarPermissao("familia_responsavel:atualizar"))):
    familiar = db.get(m.FamiliaResponsavel, familia_id)
    if not familiar:
        raise HTTPException(status_code=404, detail="Familiar beneficiário não encontrado.")
    for key, value in dados.model_dump(exclude_unset=True).items():
        setattr(familiar, key, value)
    familiar.perfil.usuario.data_edicao_conta = datetime.now()
    try:
        db.commit()
        db.refresh(familiar)
        return familiar
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao atualizar.")


@router.post("/familia/{familiar_id}/documentacao", response_model = s.cadastrarDocumento)
def upload_documento_familiar(
    familiar_id,
    db:SessionDep,
    tipo_documento:str = Form(...),
    file: UploadFile = File(...),
    permissao = Depends(VerificarPermissao("documento_familia:criar"))
    ):

    url = FirebaseStorageService.upload_file(file)
    documentacao = m.DocumentoFamilia(

        familiar_id = familiar_id,

        tipo_documento = tipo_documento,

        nome_original = file.filename,

        caminho_arquivo = url
    )
    try:
        db.add(documentacao)
        db.commit()
        db.refresh(documentacao)

    except Exception as e:
        db.rollback()
        try:
            FirebaseStorageService.delete_file(url)
        except Exception as erro_firebase:
            logging.error(f"ALERTA: Arquivo órfão criado no Firebase na url {url}. Erro: {erro_firebase}")
        raise HTTPException(
            status_code=400,
            detail="Erro ao registrar documento no banco de dados. O arquivo enviado foi descartado por segurança."
        )
    return documentacao

@router.get("/familia/{familiar_id}/documentacao", response_model=List[s.cadastrarDocumento])
def buscar_documentos_familiar(
    familiar_id: int,
    db: SessionDep,
    permissao = Depends(VerificarPermissao("documento_familia:listar"))
):
    documentos = db.query(m.DocumentoFamilia).filter(
        m.DocumentoFamilia.familiar_id == familiar_id,
        m.DocumentoFamilia.pendente_exclusao.is_(False)
    ).all()
    if not documentos:
        raise HTTPException(status_code=404, detail="Nenhum documento encontrado para este familiar.")
    return documentos

@router.delete("/familia/{familiar_id}")
def deletar_familiar(
    familiar_id,
    db:SessionDep,
    usuario_atual: m.Usuario = Depends(get_current_user),
    permissao = Depends(VerificarPermissao("familia_responsavel:deletar"))):
    familiar = db.get(m.FamiliaResponsavel,familiar_id)

    if not familiar:
        raise HTTPException(status_code=404, detail="Familiar não encontrado.")

    # Garante que o usuário logado só possa remover familiares do próprio perfil.
    if not familiar.perfil or familiar.perfil.responsavel_id != usuario_atual.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir este familiar.")
    
    db.delete(familiar)
    db.commit()
    return {"mensagem": "Familiar excluído com sucesso."}

@router.delete("/familia/documentacao/{documento_id}", status_code=status.HTTP_202_ACCEPTED)
def deletar_documento_familiar(
    documento_id: int,
    background_tasks: BackgroundTasks,
    db: SessionDep,
    permissao = Depends(VerificarPermissao("documento_familia:deletar"))
):
    documentacao = db.get(m.DocumentoFamilia, documento_id)

    if not documentacao or documentacao.pendente_exclusao:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    caminho_arquivo = documentacao.caminho_arquivo

    try:
        documentacao.pendente_exclusao = True
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao remover registro do banco.")

    background_tasks.add_task(_excluir_arquivo_firebase_background, caminho_arquivo)

    return {"mensagem": "Documento marcado para exclusão com sucesso."}


""" Triagem """

@router.post("/quiz/triagem", response_model=s.respostaUsuarioTriagem)
def salvar_resultado_triagem(
    dados: s.criarUsuarioTriagem, 
    db: SessionDep, 
    permissao = Depends(VerificarPermissao("usuario_triagem:criar"))):

    if dados.pontuacao_total < 3:
        raise HTTPException(
            status_code=400, 
            detail="Pontuação necessária não atingida para concluir a triagem."
        )

    funcao = m.UsuarioFuncao(
        usuario_id = dados.usuario_id,
        tipo_usuario = TipoUsuario.TRIAGEM
    )

    db.add(funcao)
    db.commit()
    db.refresh(funcao)
    return {
        "id": funcao.id,
        "usuario_id": dados.usuario_id,
        "pontuacao_total": dados.pontuacao_total,
        "status": "aprovado"
    }


""" Funções de Usuário """
@router.put("/{usuario_id}/funcao", response_model=list[s.respostaFuncao])
def atualizar_usuario_funcao(usuario_id: int, 
    dados: s.atualizarUsuarioFuncao, 
    db: SessionDep, 
    permissao = Depends(VerificarPermissao("usuario_funcao:atualizar"))):
    usuario = db.get(m.Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    tipos_atuais = db.query(m.UsuarioFuncao).filter(
            m.UsuarioFuncao.usuario_id == usuario_id
        )
    tipos_novos = dados.tipo_usuario 
    tipos_removidos = set(tipos_atuais) - set(tipos_novos)
    tipos_removidos = [tipo.tipo_usuario for tipo in tipos_removidos]
    
    try:
        db.query(m.UsuarioFuncao).filter(
            m.UsuarioFuncao.usuario_id == usuario_id
        ).delete()

        if TipoUsuario.RESPONSAVEL_BENEFICIARIO in tipos_removidos:
            remover_funcao_responsavel(usuario_id, db)

        funcao_usuario = []

        for tipo in tipos_novos:
            nova_funcao = m.UsuarioFuncao(
                usuario_id=usuario_id,
                tipo_usuario=tipo
            )
            db.add(nova_funcao)
            funcao_usuario.append(nova_funcao)

        usuario.data_edicao_conta = datetime.now()
        db.commit()

        for f in funcao_usuario:
            db.refresh(f)

        return funcao_usuario
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno ao atualizar funções: {str(e)}"
        )

@router.delete("/{usuario_id}/funcao/{tipo_funcao}")
def deletar_funcao_usuario(
    usuario_id, 
    tipo_funcao: TipoUsuario, 
    db: SessionDep, 
    permissao = Depends(VerificarPermissao("usuario_funcao:deletar"))
):  
    usuario = db.get(m.Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario não encontrado.")

    if tipo_funcao == TipoUsuario.RESPONSAVEL_BENEFICIARIO:
        funcao = db.query(m.UsuarioFuncao).filter(
            m.UsuarioFuncao.usuario_id == usuario_id,
            m.UsuarioFuncao.tipo_usuario == tipo_funcao
        ).first()

        if not funcao:
            raise HTTPException(status_code=404, detail="Usuario não possui a função especificada.")

        remover_funcao_responsavel(usuario_id, db)
        db.delete(funcao)
        db.commit()
        return {"mensagem": "Função excluída com sucesso."}

    funcao = db.query(m.UsuarioFuncao).filter(m.UsuarioFuncao.usuario_id == usuario_id,m.UsuarioFuncao.tipo_usuario == tipo_funcao).first()
    if not funcao:
        raise HTTPException(status_code=404, detail="Usuario não possui a função especificada.")


    db.delete(funcao)
    db.commit()
    return {"mensagem":"Função excluída com sucesso."}