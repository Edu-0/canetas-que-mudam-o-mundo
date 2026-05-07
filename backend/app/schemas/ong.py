from pydantic import BaseModel, EmailStr,Field, field_validator, ConfigDict
from datetime import date, datetime, time
from typing import Optional

class CriarOng(BaseModel):
    nome:str = Field(max_length = 255)
    cnpj: str = Field (pattern=r"^\d{14}$")
    cep: str | None = Field (pattern=r"^\d{8}$")
    rua: str = Field (max_length = 255)
    bairro: str = Field (max_length = 255)
    cidade: str = Field (max_length = 255)
    estado: str = Field (max_length = 255)
    numero: str = Field (max_length = 20)
    complemento: str | None = Field(default=None, max_length=255)
    telefone: str  | None = Field(default=None, pattern=r"^\d{10,11}$")
    email: EmailStr = Field (max_length = 255)
    sobre: str = Field (min_length = 50, max_length = 5000)
    dias_funcionamento: list[int] = Field(alias="diasFuncionamento")
    hora_abertura: time = Field(alias="horarioInicio")
    hora_fechamento: time = Field(alias="horarioFim")
    instagram: str | None = None
    facebook: str | None = None
    site: str | None = None
    

class RespostaOng(CriarOng):
    id:int
    data_cadastro: datetime
    data_edicao: Optional[datetime] = None 
    model_config = ConfigDict(
        from_attributes=True,  
        populate_by_name=True  
    )

class AtualizarOng(BaseModel):
    nome:str | None= Field(max_length = 255)
    cnpj: str | None = Field (pattern=r"^\d{14}$")
    cep: str | None= Field (pattern=r"^\d{8}$")
    rua: str | None = Field (max_length = 255)
    bairro: str | None = Field (max_length = 255)
    cidade: str  | None= Field (max_length = 255)
    estado: str | None = Field (max_length = 255)
    numero: str | None = Field (max_length = 20)
    complemento: str | None = Field(default=None, max_length=255)
    telefone: str  | None = Field(default=None, pattern=r"^\d{10,11}$")
    email: EmailStr | None = Field (max_length = 255)
    sobre: str | None = Field (min_length = 50, max_length = 5000)
    dias_funcionamento: list[int] | None = Field(alias="diasFuncionamento")
    hora_abertura: time | None = Field(alias="horarioInicio")
    hora_fechamento: time | None = Field(alias="horarioFim")
    instagram: str | None = None
    facebook: str | None = None
    site: str | None = None


class TokenOngResponse(BaseModel):
    id: int
    token: str
    ong_id: int
    data_expiracao: datetime 
    model_config = ConfigDict(from_attributes = True)   