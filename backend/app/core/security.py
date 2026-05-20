from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings
from app.core.enums import TipoUsuario

PERMISSOES_POR_FUNCAO = {
    TipoUsuario.GENERICO:{
        "usuario:atualizar",
        "usuario_triagem:atualizar",
        "usuario_responsavel:criar",
        "usuario_funcao:criar",
        "usuario_funcao:atualizar",
        "documento_usuario:criar",
        "ong:criar"
    },
    TipoUsuario.DOADOR: {
        "ong:listar",
        "doacao:criar",
        "doacao:listar",
        "doacao_item:alterar_status"
    },
    TipoUsuario.TRIAGEM: {
        "usuario:atualizar",
        "doacao:listar",
        "doacao_item:avaliar",
        "doacao_item:alterar_status",
        "doacao:notificar_status",
        "avaliacao-triagem-doacao:listar-historico-item"
    },
    TipoUsuario.RESPONSAVEL_BENEFICIARIO: {
        "usuario:atualizar",
        "usuario_responsavel:atualizar",
        "familia_responsavel:criar",
        "familia_responsavel:atualizar",
        "familia_responsavel:deletar",
        "familia_responsavel:listar",
        "documento_usuario:criar",
        "documento_usuario:atualizar",
        "documento_usuario:deletar",
        "documento_usuario:listar",
        "documento_familia:criar",
        "documento_familia:atualizar",
        "documento_familia:deletar",
        "documento_familia:listar",
        "usuario_funcao:criar",
        "usuario_funcao:atualizar",
        "usuario_funcao:deletar",
        "ong:listar",
        "doacao_item:alterar_status"
    },
    TipoUsuario.COORDENADOR_PROCESSOS:{
        "ong:editar",
        "ong:deletar",
        "ong:listar",
        "doacao:listar",
        "voluntario_ong:gerar-link-voluntario",
        "voluntario_ong:deletar-voluntario",
        "analise-triagem:listar-analises",
        "analise-triagem:verificar-analise"
    }
}



pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def gerar_hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)

def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha_pura, senha_hash)

def criar_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decodificar_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])