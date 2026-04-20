from fastapi import APIRouter, Depends, UploadFile,File, Form
from app.schemas import user as s
from app.core.security import gerar_hash_senha
from app.core.deps_auth import VerificarPermissao, get_current_user
from app.models import user as m
from app.database.connection import SessionDep
from typing import List
from app.core.enums import TipoUsuario
from fastapi import HTTPException
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError
from app.services.firebase_storage import FirebaseStorageService
from app.services.user_service import anonimizar_responsavel
from datetime import date, datetime



router = APIRouter(prefix="/usuario", tags=["usuario"])


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
        db.commit()
        db.refresh(usuario)

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
    usuario_id:int, 
    dados:s.criarUsuarioResponsavel, 
    db:SessionDep,
    permissao = Depends(VerificarPermissao("usuario_responsavel:criar"))):

    usuario = m.UsuarioResponsavel(
        responsavel_id = usuario_id,
        qtd_familiares = dados.qtd_familiares,
        auxilio = dados.auxilio,
        concordou_termos = dados.concordou_termos,
        ativo = True
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    funcao = m.UsuarioFuncao(
            usuario_id = usuario.id,
            tipo_usuario = TipoUsuario.RESPONSAVEL_BENEFICIARIO
        )

    db.add(funcao)
    db.commit()
    db.refresh(usuario)
    return usuario

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
    db.commit()
    db.refresh(perfil)
    return perfil

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
        status_code=400, 
        detail="Erro ao registrar documento no banco de dados. O arquivo enviado foi descartado por segurança."
    )

@router.get("/{responsavel_id}/documentacao", response_model=List[s.cadastrarDocumento])
def buscar_documentos_responsavel(
    responsavel_id: int, 
    db: SessionDep,
    permissao = Depends(VerificarPermissao("documento_usuario:listar"))
):
    documentos = db.query(m.DocumentoUsuario).filter(m.DocumentoUsuario.responsavel_id == responsavel_id).all()
    
    if not documentos:
        raise HTTPException(status_code=404, detail="Nenhum documento encontrado para este responsável.")
        
    return documentos

@router.delete("/documentacao/{documento_id}")
def deletar_documento_usuario(
    documento_id: int, 
    db: SessionDep,
    permissao = Depends(VerificarPermissao("documento_usuario:deletar"))
):
    documentacao = db.get(m.DocumentoUsuario, documento_id)
    
    if not documentacao:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    try:
        FirebaseStorageService.delete_file(documentacao.caminho_arquivo)
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Erro ao excluir o arquivo no servidor: {str(e)}"
        )

    db.delete(documentacao)
    db.commit()
    return {"mensagem": "Documento excluído com sucesso."}


""" Familiares """

@router.get("/familia/all", response_model = List[s.respostaFamiliaResponsavel])
def get_familiares(
    db:SessionDep,
    usuario_atual: m.Usuario = Depends(get_current_user),
    permissao = Depends(VerificarPermissao("familia_responsavel:listar"))):
    familiares = db.query(m.FamiliaResponsavel).filter(m.FamiliaResponsavel.responsavel_id == usuario_atual.id).all()
    if not familiares:
        raise HTTPException(status_code=404, detail="Não há familiares cadastrados.") 
    return familiares

@router.post("/{responsavel_id}/familia-responsavel", response_model=List[s.respostaFamiliaResponsavel])
def cadastrar_familia_responsavel(
    responsavel_id, 
    dados:List[s.cadastrarFamiliaResponsavel], 
    db:SessionDep, 
    permissao = Depends(VerificarPermissao("familia_responsavel:criar"))):
    familiares = []
    for membro in dados:
        novo_familiar = m.FamiliaResponsavel(
            responsavel_id = responsavel_id, #id do usuario na tab usuario_responsavel
            nome = membro.nome,
            cpf = membro.cpf,
            parentesco = membro.parentesco,
            data_nascimento = membro.data_nascimento,
            renda = membro.renda,
            ativo = True
        )
        familiares.append(novo_familiar)

    db.add_all(familiares)
    db.commit()
    for familiar in familiares:
        db.refresh(familiar)
    return familiares

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
    db.commit()
    db.refresh(familiar)
    return familiar

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

@router.get("/familia/{familiar_id}/documentacao", response_model=List[s.cadastrarDocumento])
def buscar_documentos_familiar(
    familiar_id: int, 
    db: SessionDep,
    permissao = Depends(VerificarPermissao("documento_familia:listar"))
):
    documentos = db.query(m.DocumentoFamilia).filter(m.DocumentoFamilia.familiar_id == familiar_id).all()
    
    if not documentos:
        raise HTTPException(status_code=404, detail="Nenhum documento encontrado para este familiar.")
        
    return documentos

@router.delete("/familia/{familiar_id}")
def deletar_familiar(
    familiar_id, 
    db:SessionDep, 
    permissao = Depends(VerificarPermissao("familia_responsavel:deletar"))):
    familiar = db.get(m.FamiliaResponsavel,familiar_id)
    if not familiar:
        raise HTTPException(status_code=404, detail="Familiar não encontrado.")
    db.delete(familiar)
    db.commit()
    return {"mensagem": "Familiar excluído com sucesso."}

@router.delete("/familia/documentacao/{documento_id}")
def deletar_documento_familiar(
    documento_id: int, 
    db: SessionDep,
    permissao = Depends(VerificarPermissao("documento_familia:deletar"))
):
    documentacao = db.get(m.DocumentoFamilia, documento_id)
    
    if not documentacao:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    try:
        FirebaseStorageService.delete_file(documentacao.caminho_arquivo)
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Erro ao excluir o arquivo no servidor: {str(e)}"
        )

    db.delete(documentacao)
    db.commit()
    return {"mensagem": "Documento excluído com sucesso."}


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


""" Funções de Usuário """
@router.put("/{usuario_id}/funcao", response_model=list[s.respostaFuncao])
def atualizar_usuario_funcao(usuario_id: int, 
    dados: s.atualizarUsuarioFuncao, 
    db: SessionDep, 
    permissao = Depends(VerificarPermissao("usuario_funcao:atualizar"))):
    usuario = db.get(m.Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    db.query(m.UsuarioFuncao).filter(
        m.UsuarioFuncao.usuario_id == usuario_id
    ).delete()

    funcao_usuario = []

    tipos = set(dados.tipo_usuario)
    tipos.add(TipoUsuario.GENERICO)

    for tipo in tipos:
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
        return anonimizar_responsavel(usuario_id,db)

    funcao = db.query(m.UsuarioFuncao).filter(m.UsuarioFuncao.usuario_id == usuario_id,m.UsuarioFuncao.tipo_usuario == tipo_funcao).first()
    if not funcao:
        raise HTTPException(status_code=404, detail="Usuario não possui a função especificada.")


    db.delete(funcao)
    db.commit()
    return {"mensagem":"Função excluída com sucesso."}



