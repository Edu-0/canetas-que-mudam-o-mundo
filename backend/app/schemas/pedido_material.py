from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import StatusPedidoMaterial


class CriarItemPedidoMaterial(BaseModel):
    tipo_material: str = Field(min_length=1, max_length=255)
    quantidade: int = Field(gt=0)


class CriarPedidoMaterial(BaseModel):
    ong_id: int
    familiar_id: int
    itens: list[CriarItemPedidoMaterial] = Field(min_length=1)


class RespostaItemPedidoMaterial(BaseModel):
    id: int
    pedido_material_id: int
    tipo_material: str
    quantidade: int
    status: StatusPedidoMaterial
    aprovado_em: Optional[datetime] = None
    coletado_em: Optional[datetime] = None
    notificado_disponivel_em: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RespostaPedidoMaterial(BaseModel):
    id: int
    responsavel_id: int
    familiar_id: int
    ong_id: int
    status: StatusPedidoMaterial
    codigo_coleta: Optional[str] = None
    prazo_retirada_limite: Optional[datetime] = None
    notificacao_aprovacao_enviada_em: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    itens: list[RespostaItemPedidoMaterial] = []

    model_config = ConfigDict(from_attributes=True)


class RespostaOpcaoMaterial(BaseModel):
    tipo_material: str
    quantidade_disponivel: int


class AtualizarStatusPedidoMaterial(BaseModel):
    status: StatusPedidoMaterial


class RespostaNotificacaoPedidoMaterial(BaseModel):
    pedido_material_id: int
    destinatario: str
    assunto: str
    corpo_html: str
    status: StatusPedidoMaterial
    codigo_coleta: Optional[str] = None
    prazo_retirada_limite: Optional[datetime] = None
