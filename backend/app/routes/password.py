from datetime import datetime, timezone, timedelta
import os
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from jose import JWTError

from app.database.connection import SessionDep
from app.core.security import criar_access_token, decodificar_token, gerar_hash_senha
from app.models import user as m
from app.models.auth import TokenDenyList
from app.core.config_email import conf
from fastapi_mail import FastMail, MessageSchema, MessageType

from app.schemas.password import PasswordResetConfirm, PasswordResetRequest

router = APIRouter(prefix="/password", tags=["password"])

@router.post("/recuperar-senha", status_code=status.HTTP_200_OK)
async def solicitar_recuperacao_senha(
    dados: PasswordResetRequest, 
    db: SessionDep, 
    background_tasks: BackgroundTasks
):
    usuario = db.query(m.Usuario).filter(m.Usuario.email == dados.email).first()
    
    if usuario:
        token_recuperacao = criar_access_token(
            data={"sub": str(usuario.id), "scope": "password_reset"},
            expires_delta=timedelta(minutes=15)
        )

        link_reset = f"{os.getenv('FRONTEND_URL')}/trocar-senha?token={token_recuperacao}"
        
        template_body = {
            "nome": usuario.nome_completo,
            "link": link_reset
        }

        mensagem = MessageSchema(
            subject="Recuperação de Senha",
            recipients=[dados.email],
            template_body=template_body, 
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        
        background_tasks.add_task(
            fm.send_message, 
            mensagem, 
            template_name="recuperar_senha.html"
        )

    return {"mensagem": "Se o e-mail estiver cadastrado, você receberá as instruções em instantes."}


@router.post("/redefinir-senha", status_code=status.HTTP_200_OK)
def redefinir_senha(dados: PasswordResetConfirm, db: SessionDep):
    try:
        payload = decodificar_token(dados.token)
        usuario_id = payload.get("sub")
        scope = payload.get("scope")

        if scope != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido para esta operação"
            )

        if not usuario_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado ou inválido"
        )

    token_revogado = db.query(TokenDenyList).filter(TokenDenyList.token == dados.token).first()
    if token_revogado:
        raise HTTPException(status_code=401, detail="Este link de recuperação já foi utilizado.")

    usuario = db.get(m.Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    usuario.senha = gerar_hash_senha(dados.nova_senha)
    usuario.data_edicao_conta = datetime.now()

    exp = payload.get("exp")
    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
    
    revoked_token = TokenDenyList(
        token=dados.token,
        user_id=usuario.id,
        expires_at=expires_at,
        revoked=True
    )

    db.add(revoked_token)
    db.commit()

    return {"mensagem": "Senha alterada com sucesso!"}