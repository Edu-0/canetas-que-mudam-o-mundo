from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy import func
from app.database.connection import SessionDep
from app.core.deps_auth import VerificarPermissao, get_current_user
from app.core.enums import TipoUsuario
from app.schemas import ong as s
from app.schemas.user import respostaUsuario
from app.models import ong as m
from app.models import user as u
from typing import List
from app.services.ong_service import remover_voluntario_ong
import uuid


router = APIRouter(prefix="/ong", tags=["ong"])

# Rota get
@router.get("/", response_model=List[s.RespostaOng])
def get_ongs(
    db:SessionDep,
    permissao = Depends(VerificarPermissao("ong:listar"))):
    ongs = db.query(m.Ong).all()
    return ongs   

@router.get("/minha-ong", response_model=s.RespostaOng)
def get_ong(
    db:SessionDep,
    usuario_atual: u.Usuario = Depends(get_current_user),
    permissao = Depends(VerificarPermissao("ong:listar"))):
    if not usuario_atual.ong:
        raise HTTPException(status_code=404, detail="Você ainda não possui uma ONG cadastrada.")
    return usuario_atual.ong

@router.get("/{ong_id}/voluntarios", response_model=list[respostaUsuario])
def listar_voluntarios_da_ong(
    ong_id: int, 
    db: SessionDep,
    usuario_atual = Depends(get_current_user)
):
    if not usuario_atual.ong or usuario_atual.ong.id != ong_id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para acessar os voluntários dessa ONG.")
    
    voluntarios = db.query(u.Usuario).join(m.VoluntarioOng, u.Usuario.id == m.VoluntarioOng.usuario_id).filter(m.VoluntarioOng.ong_id == ong_id).all()

    return voluntarios


# Rota insert
@router.post("/cadastro-ong", response_model=s.RespostaOng)
def cadastrar_ong(
    dados:s.CriarOng, 
    db:SessionDep,
    usuario_atual: u.Usuario = Depends(get_current_user),
    permissao = Depends(VerificarPermissao("ong:criar"))):
    
    ong_dict = dados.model_dump(
        by_alias=False 
    )

    ong = m.Ong(
        usuario_id=usuario_atual.id,
        **ong_dict    
    )

    try:
        db.add(ong)
        db.flush()

        funcao = u.UsuarioFuncao(
            usuario_id = usuario_atual.id,
            tipo_usuario = TipoUsuario.COORDENADOR_PROCESSOS
        )

        db.add(funcao)
        db.commit()
        db.refresh(ong)

        return ong

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail=f"Erro ao cadastrar ONG: {str(e)}"
        )

# Rota update
@router.put("/editar-ong", response_model = s.RespostaOng)
def atualizar_ong(
    dados: s.AtualizarOng,
    db: SessionDep,
    usuario_atual: u.Usuario = Depends(get_current_user),
    permissao = Depends(VerificarPermissao("ong:editar"))):
    ong = usuario_atual.ong

    ong_dict = dados.model_dump(exclude_unset=True, by_alias=False)

    try:
        for key, value in ong_dict.items():
            setattr(ong, key, value)

        ong.data_edicao = func.now()

        db.commit()
        db.refresh(ong)
        return ong
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail=f"Erro ao cadastrar ONG: {str(e)}"
        )


@router.delete("/deletar-voluntario/{voluntario_id}")
def deletar_voluntario(
    voluntario_id, db:SessionDep, 
    usuario_atual: u.Usuario = Depends(get_current_user),
    permissao = Depends(VerificarPermissao("voluntario_ong:deletar-voluntario"))):
    try:
        remover_voluntario_ong(
            db=db, 
            voluntario_id=voluntario_id, 
            ong_id=usuario_atual.ong.id, 
            ong_ativa=usuario_atual.ong.ativa
        )
        
        return {"mensagem": "Voluntário removido com sucesso!"}

    except HTTPException as http_e:
        raise http_e

    except Exception as e:
        db.rollback()
        print(f"Erro ao deletar: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao tentar remover voluntário.")

@router.delete("/deletar-ong/{ong_id}")
def deletar_ong(
    ong_id: int,  
    db: SessionDep,
    usuario_atual: u.Usuario = Depends(get_current_user),
    permissao = Depends(VerificarPermissao("ong:deletar"))
):
    if not usuario_atual.ong or usuario_atual.ong.id != ong_id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para deletar esta ONG.")

    try:
        ids_voluntarios = [vinculo.usuario_id for vinculo in usuario_atual.ong.voluntarios]

        db.query(m.VoluntarioOng).filter(m.VoluntarioOng.ong_id == ong_id).delete()

        if ids_voluntarios:
            db.query(u.UsuarioFuncao).filter(u.UsuarioFuncao.usuario_id.in_(ids_voluntarios)).delete(synchronize_session=False)
            db.query(u.Usuario).filter(u.Usuario.id.in_(ids_voluntarios)).delete(synchronize_session=False)

        ong_apagada = db.query(m.Ong).filter(m.Ong.id == ong_id).delete()

        if ong_apagada == 0:
            db.rollback()
            raise HTTPException(status_code=404, detail="ONG não encontrada no banco de dados.")
        
        funcao = db.query(u.UsuarioFuncao).filter(u.UsuarioFuncao.usuario_id == usuario_atual.id).delete()

        db.query(u.Usuario).filter(u.Usuario.id == usuario_atual.id).delete()
             
        db.commit()
        return {"mensagem": "ONG e todos os seus vínculos deletados com sucesso"} 

    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        db.rollback()
        print(f"Erro ao deletar ONG: {e}") 
        raise HTTPException(status_code=500, detail="Erro interno ao tentar remover a ONG.")

@router.post("/gerar-token-ong/{ong_id}", response_model = s.TokenOngResponse)
def gerar_token_ong(
    db:SessionDep, 
    ong_id:int,
    usuario_atual:u.Usuario = Depends(get_current_user)):

    if not usuario_atual.ong or usuario_atual.ong.id != ong_id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para gerar tokens para essa ONG.")
    
    token = str(uuid.uuid4())

    try:
        token_ong = m.TokenOng(
            ong_id = usuario_atual.ong.id,
            token = token
        )

        db.add(token_ong)
        db.commit()
        db.refresh(token_ong)
        return token_ong
    except Exception as e:
        db.rollback()
        print(f"Erro ao gerar token ong: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao salvar o token.")

@router.get("/listar-token-ong/{ong_id}") #lista os tokens gerados que ainda não foram usados
def listar_token_ong(ong_id:int, db:SessionDep, usuario_atual = Depends(get_current_user)):

    if not usuario_atual.ong or usuario_atual.ong.id != ong_id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para acessar os tokens dessa ONG.")
    
    return db.query(m.TokenOng).filter(m.TokenOng.ong_id == ong_id, m.TokenOng.usado == False).all()

@router.delete("/desativar-token-ong/{ong_id}/{token_id}")
def desativar_token_ong(
    ong_id: int, 
    token_id: int, 
    db: SessionDep, 
    usuario_atual = Depends(get_current_user)
):
    
    if not usuario_atual.ong or usuario_atual.ong.id != ong_id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para desativar os tokens dessa ONG.")
    
    try:
        linhas_afetadas = db.query(m.TokenOng).filter(
            m.TokenOng.id == token_id,
            m.TokenOng.ong_id == ong_id 
        ).delete()
        
        db.commit()

        if linhas_afetadas == 0:
            raise HTTPException(status_code=404, detail="Token não encontrado nesta ONG.")

        return {"mensagem": "Token desativado com sucesso."}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao deletar o token: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao tentar remover o token.")