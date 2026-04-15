from fastapi import APIRouter, Depends
from app.schemas import user as s
from app.core.security import gerar_hash_senha
from app.models import user as m
from app.database.connection import SessionDep
from typing import List
from app.core.enums import TipoUsuario
from fastapi import HTTPException
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/usuario", tags=["usuario"])


@router.get("/", response_model=List[s.respostaUsuario])
def get_usuarios(db:SessionDep):
    usuarios = db.query(m.Usuario).all()
    return usuarios

@router.get("/{usuario_id}", response_model=s.respostaUsuario)
def get_usuario(usuario_id,db:SessionDep):
    usuario = db.get(m.Usuario,usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return usuario
    

@router.post("/generico", response_model=s.respostaUsuario)
def criar_usuario_base(dados:s.criarUsuario, db:SessionDep):
    hash_senha = gerar_hash_senha(dados.senha)

    usuario = m.Usuario(
        nome_completo = dados.nome_completo,
        data_nascimento = dados.data_nascimento,
        cpf = dados.cpf,
        cep = dados.cep,
        telefone = dados.telefone,
        email = dados.email,
        senha = hash_senha,
        ativo = True
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

@router.post("/{usuario_id}/responsavel", response_model=s.respostaUsuarioResponsavel)
def criar_usuario_responsavel(usuario_id:int, dados:s.criarUsuarioResponsavel, db:SessionDep):

    usuario = m.UsuarioResponsavel(
        usuario_id = usuario_id,
        qtd_familiares = dados.qtd_familiares,
        auxilio = dados.auxilio,
        concordou_termos = dados.concordou_termos
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

@router.post("/{perfil_id}/familia-responsavel", response_model=List[s.respostaFamiliaResponsavel])
def cadastrar_familia_responsavel(perfil_id, dados:List[s.cadastrarFamiliaResponsavel], db:SessionDep):
    familiares = []
    for membro in dados:
        novo_familiar = m.FamiliaResponsavel(
            perfil_id = perfil_id, #id do usuario na tab usuario_responsavel
            nome = membro.nome,
            cpf = membro.cpf,
            parentesco = membro.parentesco,
            data_nascimento = membro.data_nascimento,
            renda = membro.renda
        )
        familiares.append(novo_familiar)

    db.add_all(familiares)
    db.commit()
    for familiar in familiares:
        db.refresh(familiar)
    return familiares

@router.put("/{usuario_id}", response_model=s.respostaUsuario)
def atualizar_usuario(usuario_id, dados:s.atualizarUsuario, db:SessionDep):
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


@router.put("/{usuario_id}/funcao", response_model=list[s.respostaFuncao])
def atualizar_usuario_funcao(usuario_id: int, dados: s.atualizarUsuarioFuncao, db: SessionDep):
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

    usuario.data_edicao_conta = func.now()
    db.commit()

    for f in funcao_usuario:
        db.refresh(f)

    return funcao_usuario

@router.put("/{perfil_id}/responsavel", response_model=s.respostaUsuarioResponsavel)
def atualizar_usuario_responsavel(perfil_id, dados:s.atualizarUsuarioResponsavel, db:SessionDep):
    perfil = db.get(m.UsuarioResponsavel, perfil_id)
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil de beneficiário não encontrado.")
    for key, value in dados.model_dump(exclude_unset=True).items():
        setattr(perfil, key, value)
    perfil.usuario.data_edicao_conta = func.now()
    db.commit()
    db.refresh(perfil)
    return perfil

@router.put("/{familia_id}/familia-responsavel", response_model=s.respostaFamiliaResponsavel)
def atualizar_familia_responsavel(familia_id, dados:s.atualizarFamiliaResponsavel, db:SessionDep):
    familiar = db.get(m.FamiliaResponsavel, familia_id)
    if not familiar:
        raise HTTPException(status_code=404, detail="Familiar beneficiário não encontrado.")
    for key, value in dados.model_dump(exclude_unset=True).items():
        setattr(familiar, key, value)
    familiar.perfil.usuario.data_edicao_conta = func.now()
    db.commit()
    db.refresh(familiar)
    return familiar

@router.put("/{documento_id}/documento", response_model=s.respostaDocumento)
def atualizar_documento(documento_id, dados:s.atualizarDocumento, db:SessionDep):
    documento = db.get(m.DocumentoUsuario, documento_id)
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")
    for key, value in dados.model_dump(exclude_unset=True).items():
        setattr(documento, key, value)
    db.commit()
    db.refresh(documento)
    return documento