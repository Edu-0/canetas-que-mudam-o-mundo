import uuid
from sqlalchemy.orm import Session
from app.database.connection import SessionDep
from app.models import user as m
from fastapi import HTTPException
from datetime import datetime
from app.services.firebase_storage import FirebaseStorageService
from app.core.enums import TipoUsuario


def anonimizar_responsavel(usuario_id, db:SessionDep):
    print("Entrou na anonimização")
    responsavel = db.query(m.UsuarioResponsavel).filter(m.UsuarioResponsavel.responsavel_id == usuario_id).first()

    if not responsavel:
        raise HTTPException(status_code=404, detail="Responsável não encontrado.")
        
    familiares = db.query(m.FamiliaResponsavel).filter(m.FamiliaResponsavel.responsavel_id == responsavel.id).all()
    
    for familiar in familiares:
        familiar.nome= f"Familiar #{familiar.id} desativado."
        familiar.cpf =  "00000000000"
        familiar.email = f"anonimo{familiar.id}@deletado.com"
        familiar.data_edicao = datetime.now()
        familiar.ativo = False
        documentacao_familiar = db.query(m.DocumentoFamilia).filter(
        m.DocumentoFamilia.familiar_id == familiar.id).all()

        if not documentacao_familiar:
            continue

        for doc in documentacao_familiar:
            try:
                FirebaseStorageService.delete_file(doc.caminho_arquivo)
            except Exception as e:
                logging.warning(f"Erro ao apagar doc familiar no Storage: {e}")
                doc.pendente_exclusao = True
                continue
            db.delete(doc)

    documentacao_usuario = db.query(m.DocumentoUsuario).filter(m.DocumentoUsuario.responsavel_id == usuario_id).all()

    for doc in documentacao_usuario:
        try:
            FirebaseStorageService.delete_file(doc.caminho_arquivo)
        except Exception as e:
            logging.warning(f"Erro ao apagar doc familiar no Storage: {e}")
            doc.pendente_exclusao = True
            continue
        db.delete(doc)

    responsavel.ativo = False
    return {"mensagem":"Reponsável e familiares excluídos com sucesso."}
    

    


