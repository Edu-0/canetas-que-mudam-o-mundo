from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError

from app.database.connection import SessionDep
from app.schemas.auth import LoginRequest, TokenResponse, LogoutResponse
from app.models.user import Usuario
from app.models.auth import TokenDenyList
from app.core.security import verificar_senha, criar_access_token, decodificar_token
from app.core.deps_auth import get_current_user, get_current_token


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(dados: LoginRequest, db: SessionDep):
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )

    if not verificar_senha(dados.senha, usuario.senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )

    access_token = criar_access_token(data={"sub": str(usuario.id)})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )


@router.post("/logout", response_model=LogoutResponse)
def logout(db: SessionDep, current_user: Usuario = Depends(get_current_user), token: str = Depends(get_current_token)):
    try:
        payload = decodificar_token(token)
        exp = payload.get("exp")

        if not exp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token sem expiração válida"
            )

        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

    token_existente = db.query(TokenDenyList).filter(
        TokenDenyList.token == token
    ).first()

    if token_existente:
        return LogoutResponse(message="Logout realizado com sucesso")

    revoked_token = TokenDenyList(
        token=token,
        user_id=current_user.id,
        expires_at=expires_at,
        revoked=True
    )

    db.add(revoked_token)
    db.commit()

    return LogoutResponse(message="Logout realizado com sucesso")


@router.get("/me")
def me(current_user: Usuario = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "nome_completo": current_user.nome_completo,
        "email": current_user.email,
        "data_nascimento": current_user.data_nascimento,
        "cpf": current_user.cpf,
        "cep": current_user.cep,
        "telefone": current_user.telefone,
        "senha": current_user.senha,
        "ativo": current_user.ativo
    }