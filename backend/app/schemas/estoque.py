from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.doacao import RespostaItemDoacao


class RespostaItemEstoque(BaseModel):
    id: int
    item_doacao_id: int
    disponivel_em: datetime
    retirado_em: Optional[datetime] = None
    item_doacao: RespostaItemDoacao
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
