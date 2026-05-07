from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import Usuario, UsuarioFuncao
from app.models.ong import VoluntarioOng, TokenOng
from app.database.connection import engine, SessionDep
from app.services.user_service import anonimizar_usuario
from datetime import datetime

def remover_voluntario_ong(db: SessionDep, voluntario_id: int, ong_id: int, ong_ativa: bool):
    vinculo_deletado = db.query(VoluntarioOng).filter(
        VoluntarioOng.ong_id == ong_id, 
        VoluntarioOng.usuario_id == voluntario_id   
    ).delete()

    if vinculo_deletado == 0:
        db.rollback()
        raise HTTPException(status_code=404, detail="Voluntário não encontrado nesta ONG.")


    voluntario = db.query(Usuario).filter(Usuario.id == voluntario_id).first()
    
    if ong_ativa:
        anonimizar_usuario(voluntario) 
    else:
        db.query(UsuarioFuncao).filter(UsuarioFuncao.usuario_id == voluntario_id).delete()
        voluntario_deletado = db.query(Usuario).filter(Usuario.id == voluntario_id).delete() 
        if voluntario_deletado == 0:
            db.rollback()
            raise HTTPException(status_code=404, detail="Cadastro do voluntário não encontrado.")
    
    db.commit()

def limpar_tokens_vencidos(ong_id: int):
    with Session(engine) as db:
        try:
            db.query(TokenOng).filter(
                TokenOng.ong_id == ong_id,
                TokenOng.data_expiracao < datetime.now()
            ).delete(synchronize_session=False)
            
            db.commit()            
        except Exception as e:
            db.rollback()
            print(f"[Background Task] Erro fatal: {e}")
