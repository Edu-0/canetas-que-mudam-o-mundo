from pydantic import BaseModel, EmailStr,Field, field_validator, ConfigDict
from datetime import date
from app.core.enums import BeneficiosUsuario, TipoUsuario
from typing import Optional


class usuarioBase(BaseModel):
    nome_completo: str = Field(min_length=2, max_length=255)
    data_nascimento : date 
    cep : str = Field (pattern=r"^\d{8}$")
    cpf: str = Field (pattern=r"^\d{11}$")
    telefone: str = Field(pattern=r"^\d{10,11}$")
    email: EmailStr
    funcao: Optional[TipoUsuario] = TipoUsuario.GENERICO
    
    @field_validator('data_nascimento')
    @classmethod
    def verificar_maioridade(cls, v: date):
        hoje = date.today()
        idade = hoje.year - v.year - ((hoje.month, hoje.day) < (v.month, v.day))
        
        if idade < 18:
            raise ValueError('O usuário deve ter pelo menos 18 anos.')
        
        if v > hoje:
            raise ValueError('Data de nascimento não pode ser no futuro.')
        return v
    
class criarUsuario(usuarioBase):
    senha: str = Field(min_length=8, pattern=r"^(?=.*[A-Z])(?=.*\d).+$")


class respostaUsuario(usuarioBase):
    model_config = ConfigDict(from_attributes=True)
    id:int
    

class criarUsuarioBeneficiario(usuarioBase):
    qtd_familiares : int = Field(default=0, ge = 0)
    auxilio: BeneficiosUsuario = BeneficiosUsuario.NENHUM
    concordou_termos: bool = False
    data_preenchimento: date = Field(default_factory=date.today)

    @field_validator('concordou_termos')
    @classmethod
    def verificar_aceitacao_termo(cls, v:bool):
        if not v:
            raise ValueError('Você deve ler e aceitar os termos de uso para prosseguir com o cadastro.')
        return v

class respostaUsuarioBeneficiario(criarUsuarioBeneficiario):
    model_config = ConfigDict(from_attributes=True)
    id:int


class cadastrarFamiliaBeneficiario(BaseModel):
    nome: str = Field(min_length=2, max_length=255)
    parentesco: str = Field(min_length=2, max_length=100)
    data_nascimento: date 
    renda: float = Field(default=0.0, ge=0)

    @field_validator('renda')
    @classmethod
    def verificarRenda(cls, v:float):
        if v > 100000:
            raise ValueError('O valor informado excede o limite permitido para o campo.')
        return round(v, 2)
    
    @field_validator('data_nascimento')
    @classmethod
    def verificar_maioridade(cls, v: date):
        hoje = date.today()        
        if v > hoje:
            raise ValueError('Data de nascimento não pode ser no futuro.')
        return v

class respostaFamiliaBeneficiario(cadastrarFamiliaBeneficiario):
    model_config = ConfigDict(from_attributes=True)
    id: int

    

class cadastrarDocumento(BaseModel):
    tipo_documento: str = Field(min_length=2,max_length=50)
    nome_original:str = Field(min_length=2, max_length=255)
    caminho_arquivo:str = Field(min_length=2, max_length=1000)
    data_upload: date = Field(default_factory=date.today)

    @field_validator('nome_original')
    @classmethod
    def validar_extensao(cls, v: str):
        extensoes_permitidas = ['.pdf', '.jpg', '.jpeg', '.png']
        if not any(v.lower().endswith(ext) for ext in extensoes_permitidas):
            raise ValueError(f'Extensão de arquivo não permitida. Use: {", ".join(extensoes_permitidas)}')
        return v
    
    @field_validator('tipo_documento')
    @classmethod
    def formatar_tipo(cls, v: str):
        return v.strip().upper()
    

class respostaDocumento(cadastrarDocumento):
    model_config = ConfigDict(from_attributes=True)
    id:int