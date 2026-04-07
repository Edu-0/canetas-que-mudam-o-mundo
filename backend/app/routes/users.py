from fastapi import APIRouter, Depends
from app.schemas import user as s
from app.core.security import gerar_hash_senha
from app.models import user as m
from app.database.connection import SessionDep
from typing import List
from fastapi import HTTPException

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
    )

    db.add(usuario)
    db.commit()
    # pega info que são geradas apenas após a criação no bd como id, data de inserção... etc
    db.refresh(usuario)

    funcao = m.UsuarioFuncao(
        usuario_id = usuario.id,
        tipo_usuario = dados.funcao
    )

    db.add(funcao)
    db.commit()
    db.refresh(usuario)
    # retorna apenas as informações indicadas no response_model
    return usuario

@router.post("/{usuario_id}/beneficiario", response_model=s.respostaUsuarioBeneficiario)
def criar_usuario_beneficiario(usuario_id, dados:s.criarUsuarioBeneficiario, db:SessionDep):

    usuario = m.UsuarioBeneficiario(
        usuario_id = usuario_id,
        qtd_familiares = dados.qtd_familiares,
        auxilio = dados.auxilio,
        concordou_termos = dados.concordou_termos
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

@router.post("/{perfil_id}/familia-beneficiario", response_model=List[s.respostaFamiliaBeneficiario])
def cadastrar_familia_beneficiario(perfil_id, dados:List[s.cadastrarFamiliaBeneficiario], db:SessionDep):
    familiares = []
    for membro in dados:
        novo_familiar = m.FamiliaBeneficiario(
            perfil_id = perfil_id, #id do usuario na tab usuario_beneficiario
            nome = membro.nome,
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
