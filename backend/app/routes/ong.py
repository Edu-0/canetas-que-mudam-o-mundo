from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy import func
from app.database.connection import SessionDep
from app.core.deps_auth import VerificarPermissao, get_current_user
from app.core.enums import TipoUsuario
from app.schemas import ong as s
from app.models import ong as m
from app.models import user as u
from typing import List
from app.services.user_service.anonimizar_usuario

router = APIRouter(prefix="/ong", tags=["ong"])

# Rota get
@router.get("/", response_model=List[s.RespostaOng])
def get_ongs(db:SessionDep):
    ongs = db.query(m.Ong).all()
    return ongs   

@router.get("/minha-ong", response_model=s.RespostaOng)
def get_ong(
    db:SessionDep,
    usuario_atual: u.Usuario = Depends(get_current_user)):
    if not usuario_atual.ong:
        raise HTTPException(status_code=404, detail="Você ainda não possui uma ONG cadastrada.")
    return usuario_atual.ong

# Rota insert
@router.post("/cadastro-ong", response_model=s.RespostaOng)
def cadastrar_ong(
    dados:s.CriarOng, 
    db:SessionDep,
    usuario_atual: u.Usuario = Depends(get_current_user)):
    
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
    usuario_atual: u.Usuario = Depends(get_current_user)):
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
def deletar_voluntario(voluntario_id, db:SessionDep, usuario_atual: u.Usuario = Depends(get_current_user)):

    try:
        vinculo_deletado = db.query(VoluntarioOng).filter(
                VoluntarioOng.ong_id == usuario_atual.ong.id, 
                VoluntarioOng.usuario_id == voluntario_id   
            ).delete()

        if vinculo_deletado == 0:
            db.rollback()
            raise HTTPException(status_code=404, detail="Voluntário não encontrado nesta ONG.")

        funcao_deletada = db.query(UsuarioFuncao).filter(UsuarioFuncao.usuario_id == voluntario_id).delete()
        
        if usuario_atual.ong.ativa == True:
            voluntario = db.query(Usuario).filter(Usuario.id == voluntario_id).delete()
            anonimizar_usuario(voluntario)
        else:
            voluntario_deletado = db.query(Usuario).filter(Usuario.id == voluntario_id).delete() 
            if voluntario_deletado == 0:
                db.rollback()
                raise HTTPException(status_code=404, detail="Cadastro do voluntário não encontrado.")
        
        db.commit()

        return {"mensagem": "Voluntário removido com sucesso!"}

    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao tentar remover voluntário.")
        print(f"Erro ao deletar: {e}")

@router.put("/deletar-ong", response_model = s.RespostaOng)
def deletar_ong(
    db: SessionDep,
    usuario_atual: u.Usuario = Depends(get_current_user)):
    
    
    return {"mensagem: Usuário deletado com sucesso"}