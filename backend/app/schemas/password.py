from pydantic import EmailStr, BaseModel

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    nova_senha: str