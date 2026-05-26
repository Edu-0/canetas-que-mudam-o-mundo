from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.enums import StatusPedidoMaterial
from app.database.connection import Base


class PedidoMaterial(Base):
    __tablename__ = "pedido_material"

    id = Column(Integer, primary_key=True)
    responsavel_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    familiar_id = Column(Integer, ForeignKey("familia_responsavel.id"), nullable=False)
    ong_id = Column(Integer, ForeignKey("ong.id"), nullable=False)
    status = Column(
        Enum(StatusPedidoMaterial),
        default=StatusPedidoMaterial.AGUARDANDO_APROVACAO,
        nullable=False,
    )
    codigo_coleta = Column(String(32), nullable=True, unique=True)
    prazo_retirada_limite = Column(DateTime, nullable=True)
    notificacao_aprovacao_enviada_em = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    responsavel = relationship("Usuario")
    familiar = relationship("FamiliaResponsavel")
    ong = relationship("Ong")
    itens = relationship(
        "ItemPedidoMaterial",
        back_populates="pedido",
        cascade="all, delete-orphan",
    )

    @property
    def responsavel_nome(self) -> str | None:
        return self.responsavel.nome_completo if self.responsavel else None

    @property
    def status_tag(self) -> str:
        return self.status.value.replace("_", " ").capitalize()


class ItemPedidoMaterial(Base):
    __tablename__ = "item_pedido_material"

    id = Column(Integer, primary_key=True)
    pedido_material_id = Column(Integer, ForeignKey("pedido_material.id"), nullable=False)
    tipo_material = Column(String(255), nullable=False)
    quantidade = Column(Integer, nullable=False)
    status = Column(
        Enum(StatusPedidoMaterial),
        default=StatusPedidoMaterial.AGUARDANDO_APROVACAO,
        nullable=False,
    )
    aprovado_em = Column(DateTime, nullable=True)
    coletado_em = Column(DateTime, nullable=True)
    notificado_disponivel_em = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    pedido = relationship("PedidoMaterial", back_populates="itens")
