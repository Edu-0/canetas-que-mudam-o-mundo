from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class MovimentoEstoque(Base):
    __tablename__ = "movimento_estoque"

    id = Column(Integer, primary_key=True)
    tipo = Column(String(32), nullable=False)  # RESERVA, LIBERACAO, CONSUMO
    item_pedido_material_id = Column(Integer, ForeignKey("item_pedido_material.id"), nullable=True)
    item_doacao_id = Column(Integer, ForeignKey("item_doacao.id"), nullable=True)
    quantidade = Column(Integer, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuario.id"), nullable=True)
    detalhe = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    item_pedido = relationship("ItemPedidoMaterial")
    item_doacao = relationship("ItemDoacao")
    usuario = relationship("Usuario")
