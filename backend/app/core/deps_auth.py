from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from app.database.connection import SessionDep
from app.core.security import decodificar_token
from app.models.user import Usuario
from app.models.auth import TokenDenyList


bearer_scheme = HTTPBearer()


def token_esta_revogado(token: str, db: SessionDep) -> bool:
    token_db = db.query(TokenDenyList).filter(
        TokenDenyList.token == token,
        TokenDenyList.revoked == True
    ).first()

    return token_db is not None


def get_current_user(db: SessionDep, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> Usuario:
    token = credentials.credentials

    if token_esta_revogado(token, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou revogado"
        )

    try:
        payload = decodificar_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não foi possível validar o token"
        )

    usuario = db.query(Usuario).filter(Usuario.id == int(user_id)).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )

    return usuario


def get_current_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
    return credentials.credentials