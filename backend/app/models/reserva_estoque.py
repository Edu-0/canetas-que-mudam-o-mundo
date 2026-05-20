from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class ReservaEstoque(Base):
    __tablename__ = "reserva_estoque"

    id = Column(Integer, primary_key=True)
    item_pedido_material_id = Column(Integer, ForeignKey("item_pedido_material.id"), nullable=False)
    item_doacao_id = Column(Integer, ForeignKey("item_doacao.id"), nullable=False)
    quantidade = Column(Integer, nullable=False)
    reservado_em = Column(DateTime, server_default=func.now(), nullable=False)
    consumido_em = Column(DateTime, nullable=True)
    consumido_por_id = Column(Integer, ForeignKey("usuario.id"), nullable=True)

    item_pedido = relationship("ItemPedidoMaterial")
    item_doacao = relationship("ItemDoacao")
    consumido_por = relationship("Usuario", foreign_keys=[consumido_por_id])
