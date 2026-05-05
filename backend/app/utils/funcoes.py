import uuid
import hashlib


def gerar_codigo_numerico(base: str, tamanho: int) -> str:
    numero = int(hashlib.sha256(base.encode("utf-8")).hexdigest(), 16)
    return str(numero % (10 ** tamanho)).zfill(tamanho)

def gerar_email_anonimo(usuario_id: int) -> str: # Mantém formato de email, irreversível e único, sem revelar informações pessoais.
    return f"anonimo.{usuario_id}.{uuid.uuid4().hex[:12]}@deletado.com"
