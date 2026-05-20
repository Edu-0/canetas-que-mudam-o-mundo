from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class MovimentoEstoqueResposta(BaseModel):
    id: int
    tipo: str
    item_pedido_material_id: Optional[int] = None
    item_doacao_id: Optional[int] = None
    quantidade: int
    usuario_id: Optional[int] = None
    detalhe: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
