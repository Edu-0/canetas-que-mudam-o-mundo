from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.enums import ResultadoTriagemDoacao, StatusDoacao
from app.models.doacao import MAX_TAMANHO_FOTO_DOACAO_BYTES
from app.schemas.user import ResumoVoluntario

class CriarFotoItemDoacao(BaseModel):
    url: str = Field(min_length=1, max_length=2000)
    nome_original: Optional[str] = Field(default=None, max_length=255)
    content_type: str = Field(min_length=1, max_length=255)
    tamanho_bytes: int = Field(gt=0, le=MAX_TAMANHO_FOTO_DOACAO_BYTES)
    checksum: Optional[str] = Field(default=None, max_length=255)


class RespostaFotoItemDoacao(CriarFotoItemDoacao):
    id: int
    item_doacao_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CriarItemDoacao(BaseModel):
    tipo_material: str = Field(min_length=1, max_length=255)
    descricao: str = Field(min_length=1, max_length=5000)
    possiveis_defeitos: Optional[str] = Field(default=None, max_length=5000)
    quantidade: int = Field(gt=0)
    fotos: list[CriarFotoItemDoacao] = Field(min_length=1)


class CriarItemDoacaoFormulario(BaseModel):
    tipo_material: str = Field(min_length=1, max_length=255)
    descricao: str = Field(min_length=1, max_length=5000)
    possiveis_defeitos: Optional[str] = Field(default=None, max_length=5000)
    quantidade: int = Field(gt=0)
    fotos_indices: list[int] = Field(min_length=1)

    @field_validator("fotos_indices")
    @classmethod
    def validar_indices_nao_repetidos(cls, valores: list[int]) -> list[int]:
        if len(valores) != len(set(valores)):
            raise ValueError("Os índices de fotos não podem se repetir no mesmo item.")
        if any(valor < 0 for valor in valores):
            raise ValueError("Os índices de fotos devem ser maiores ou iguais a zero.")
        return valores


class CriarDoacao(BaseModel):
    ong_id: int
    observacao_doador: Optional[str] = Field(default=None, max_length=5000)
    itens: list[CriarItemDoacao] = Field(min_length=1)


class RespostaItemDoacao(BaseModel):
    id: int
    doacao_id: int
    tipo_material: str
    descricao: str
    possiveis_defeitos: Optional[str] = None
    quantidade: int
    status: StatusDoacao
    motivo_inaptidao: Optional[str] = None
    triado_por_id: Optional[int] = None
    recebido_por_id: Optional[int] = None
    coletado_por_id: Optional[int] = None
    triado_em: Optional[datetime] = None
    pre_aprovado_em: Optional[datetime] = None
    recebido_em: Optional[datetime] = None
    disponivel_em: Optional[datetime] = None
    coletado_em: Optional[datetime] = None
    em_quarentena: bool = False
    created_at: datetime
    updated_at: datetime
    fotos: list[RespostaFotoItemDoacao] = []

    model_config = ConfigDict(from_attributes=True)


class RespostaDoacao(BaseModel):
    id: int
    doador_id: int
    ong_id: int
    status: StatusDoacao
    codigo_coleta: str
    observacao_doador: Optional[str] = None
    email_status_enviado_em: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    itens: list[RespostaItemDoacao] = []

    model_config = ConfigDict(from_attributes=True)


class RespostaListagemDoacao(RespostaDoacao):
    tempo_cadastrada_dias: int
    tempo_cadastrada_tag: str
    status_tag: str
    doador_nome: Optional[str] = None


class AtualizarStatusItemDoacao(BaseModel):
    status: StatusDoacao
    motivo_inaptidao: Optional[str] = Field(default=None, max_length=5000)


class CriarAvaliacaoTriagemDoacao(BaseModel):
    resultado: ResultadoTriagemDoacao
    checklist: Optional[dict[str, Any]] = None
    comentario: Optional[str] = Field(default=None, max_length=5000)
    motivo_inaptidao: Optional[str] = Field(default=None, max_length=5000)

    @field_validator("motivo_inaptidao")
    @classmethod
    def normalizar_motivo(cls, valor: Optional[str]) -> Optional[str]:
        if valor is None:
            return None
        valor = valor.strip()
        return valor or None


class RespostaAvaliacaoTriagemDoacao(BaseModel):
    id: int
    item_doacao_id: int
    voluntario_triagem_id: int
    resultado: ResultadoTriagemDoacao
    checklist: Optional[dict[str, Any]] = None
    comentario: Optional[str] = None
    motivo_inaptidao: Optional[str] = None
    coordenador_revisor_id: Optional[int] = None
    resultado_validado: Optional[bool] = None
    validado_em: Optional[datetime] = None
    created_at: datetime
    voluntario_triagem: ResumoVoluntario 

    model_config = ConfigDict(from_attributes=True)

class DoacaoResumoQuarentena(BaseModel):
    id: int
    observacao_doador: Optional[str] = None
    status: StatusDoacao 
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class FotoResumoQuarentena(BaseModel):
    id: int
    url: str

    model_config = ConfigDict(from_attributes=True)

class ItemDoacaoResumoQuarentena(BaseModel):
    id: int
    tipo_material: str
    descricao: str
    quantidade: int
    
    possiveis_defeitos: Optional[str] = None
    motivo_inaptidao: Optional[str] = None

    status: StatusDoacao

    doacao: DoacaoResumoQuarentena  
    fotos: list[FotoResumoQuarentena] = []

    model_config = ConfigDict(from_attributes=True)

class RespostaListagemQuarentena(BaseModel):
    id: int
    resultado: ResultadoTriagemDoacao  
    checklist: Optional[dict[str, Any]] = None  
    comentario: Optional[str] = None
    em_quarentena: bool
    created_at: datetime
    motivo_inaptidao: Optional[str] = None
    
    voluntario_triagem: ResumoVoluntario  
    item_doacao: ItemDoacaoResumoQuarentena  

    model_config = ConfigDict(from_attributes=True)

class RespostaRevisarAvaliacaoTriagem(BaseModel):
    resultado_validado: bool = Field(
        ..., 
        description="True se o coordenador concorda com a análise do voluntário, False se discorda."
    )
    comentario_coordenador: Optional[str] = Field(
        default=None, 
        max_length=5000,
        description="Feedback do coordenador sobre a avaliação em quarentena."
    )

class RespostaNotificacaoDoacao(BaseModel):
    doacao_id: int
    email_status_enviado_em: datetime
    destinatario: str
    endereco_ong: str
    dias_funcionamento: list[int]
    hora_abertura: str
    hora_fechamento: str
