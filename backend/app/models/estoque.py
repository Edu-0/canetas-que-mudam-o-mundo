from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class ItemEstoque(Base):
    __tablename__ = "item_estoque"
    __table_args__ = (
        UniqueConstraint("item_doacao_id", name="uq_item_estoque_item_doacao"),
    )

    id = Column(Integer, primary_key=True)
    item_doacao_id = Column(Integer, ForeignKey("item_doacao.id"), nullable=False)
    disponivel_em = Column(DateTime, nullable=False, default=datetime.now)
    retirado_em = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    item_doacao = relationship("ItemDoacao", back_populates="estoque", uselist=False)