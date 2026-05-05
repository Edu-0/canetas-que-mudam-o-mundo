from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import Usuario
from app.models.ong import VoluntarioOng
from app.database.connection import SessionDep
from app.services.user_service import anonimizar_usuario

def remover_voluntario_ong(db: SessionDep, voluntario_id: int, ong_id: int, ong_ativa: bool):
    vinculo_deletado = db.query(VoluntarioOng).filter(
        VoluntarioOng.ong_id == ong_id, 
        VoluntarioOng.usuario_id == voluntario_id   
    ).delete()

    if vinculo_deletado == 0:
        db.rollback()
        raise HTTPException(status_code=404, detail="Voluntário não encontrado nesta ONG.")

    db.query(UsuarioFuncao).filter(UsuarioFuncao.usuario_id == voluntario_id).delete()
    
    if ong_ativa:
        anonimizar_usuario(db, voluntario_id) 
    else:
        voluntario_deletado = db.query(Usuario).filter(Usuario.id == voluntario_id).delete() 
        if voluntario_deletado == 0:
            db.rollback()
            raise HTTPException(status_code=404, detail="Cadastro do voluntário não encontrado.")
    
    db.commit()