from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.enums import ResultadoTriagemDoacao, StatusDoacao
from app.database.connection import Base


MAX_TAMANHO_FOTO_DOACAO_BYTES = 10 * 1024 * 1024


class Doacao(Base):
    __tablename__ = "doacao"

    id = Column(Integer, primary_key=True)
    doador_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    ong_id = Column(Integer, ForeignKey("ong.id"), nullable=False)
    status = Column(
        Enum(StatusDoacao),
        default=StatusDoacao.AGUARDANDO_TRIAGEM,
        nullable=False,
    )
    observacao_doador = Column(Text, nullable=True)
    email_status_enviado_em = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    doador = relationship("Usuario", back_populates="doacoes")
    ong = relationship("Ong", back_populates="doacoes")
    itens = relationship(
        "ItemDoacao",
        back_populates="doacao",
        cascade="all, delete-orphan",
    )

    @property
    def doador_nome(self) -> str | None:
        return self.doador.nome_completo if self.doador else None
    
    @property
    def tempo_cadastrada_dias(self) -> int:
        if not self.created_at:
            return 0

        if self.created_at.tzinfo:
            agora = datetime.now(tz=self.created_at.tzinfo)
        else:
            agora = datetime.now()
        return max((agora.date() - self.created_at.date()).days, 0)

    @property
    def tempo_cadastrada_tag(self) -> str:
        dias = self.tempo_cadastrada_dias
        if dias == 0:
            return "Cadastrada hoje"
        if dias == 1:
            return "Cadastrada há 1 dia"
        return f"Cadastrada há {dias} dias"

    @property
    def status_tag(self) -> str:
        return self.status.value.replace("_", " ").capitalize()

    @property
    def codigo_coleta(self) -> str:
        return f"D-{self.id:08d}" if self.id is not None else ""


class ItemDoacao(Base):
    __tablename__ = "item_doacao"
    __table_args__ = (
        CheckConstraint("quantidade > 0", name="ck_item_doacao_quantidade_positiva"),
    )

    id = Column(Integer, primary_key=True)
    doacao_id = Column(Integer, ForeignKey("doacao.id"), nullable=False)
    tipo_material = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=False)
    possiveis_defeitos = Column(Text, nullable=True)
    quantidade = Column(Integer, nullable=False)
    status = Column(
        Enum(StatusDoacao),
        default=StatusDoacao.AGUARDANDO_TRIAGEM,
        nullable=False,
    )
    motivo_inaptidao = Column(Text, nullable=True)
    triado_por_id = Column(Integer, ForeignKey("usuario.id"), nullable=True)
    recebido_por_id = Column(Integer, ForeignKey("usuario.id"), nullable=True)
    coletado_por_id = Column(Integer, ForeignKey("usuario.id"), nullable=True)
    triado_em = Column(DateTime, nullable=True)
    pre_aprovado_em = Column(DateTime, nullable=True)
    recebido_em = Column(DateTime, nullable=True)
    disponivel_em = Column(DateTime, nullable=True)
    coletado_em = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    doacao = relationship("Doacao", back_populates="itens")
    estoque = relationship(
        "ItemEstoque",
        back_populates="item_doacao",
        uselist=False,
        cascade="all, delete-orphan",
    )
    fotos = relationship(
        "FotoItemDoacao",
        back_populates="item_doacao",
        cascade="all, delete-orphan",
    )
    avaliacoes_triagem = relationship(
        "AvaliacaoTriagemDoacao",
        back_populates="item_doacao",
        cascade="all, delete-orphan",
    )
    triado_por = relationship("Usuario", foreign_keys=[triado_por_id])
    recebido_por = relationship("Usuario", foreign_keys=[recebido_por_id])
    coletado_por = relationship("Usuario", foreign_keys=[coletado_por_id])

    @property
    def em_quarentena(self) -> bool:
        if not self.avaliacoes_triagem:
            return False

        ultima_avaliacao = max(
            self.avaliacoes_triagem,
            key=lambda avaliacao: avaliacao.created_at or datetime.min,
        )
        return bool(ultima_avaliacao.em_quarentena)


class FotoItemDoacao(Base):
    __tablename__ = "foto_item_doacao"
    __table_args__ = (
        CheckConstraint(
            f"tamanho_bytes <= {MAX_TAMANHO_FOTO_DOACAO_BYTES}",
            name="ck_foto_item_doacao_tamanho_maximo",
        ),
    )

    id = Column(Integer, primary_key=True)
    item_doacao_id = Column(Integer, ForeignKey("item_doacao.id"), nullable=False)
    url = Column(Text, nullable=False)
    nome_original = Column(String(255), nullable=True)
    content_type = Column(String(255), nullable=False)
    tamanho_bytes = Column(Integer, nullable=False)
    checksum = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    item_doacao = relationship("ItemDoacao", back_populates="fotos")


class AvaliacaoTriagemDoacao(Base):
    __tablename__ = "avaliacao_triagem_doacao"

    id = Column(Integer, primary_key=True)
    item_doacao_id = Column(Integer, ForeignKey("item_doacao.id"), nullable=False)
    voluntario_triagem_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    resultado = Column(Enum(ResultadoTriagemDoacao), nullable=False)
    checklist = Column(JSON, nullable=True)
    comentario = Column(Text, nullable=True)
    motivo_inaptidao = Column(Text, nullable=True)
    em_quarentena = Column(Boolean, default=False, nullable=False)
    coordenador_revisor_id = Column(Integer, ForeignKey("usuario.id"), nullable=True)
    resultado_validado = Column(Boolean, nullable=True)
    validado_em = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    item_doacao = relationship("ItemDoacao", back_populates="avaliacoes_triagem")
    voluntario_triagem = relationship(
        "Usuario",
        foreign_keys=[voluntario_triagem_id],
        back_populates="avaliacoes_triagem_doacao",
    )
    coordenador_revisor = relationship("Usuario", foreign_keys=[coordenador_revisor_id])
