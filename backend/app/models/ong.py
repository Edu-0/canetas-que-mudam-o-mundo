from sqlalchemy import Column, Integer, Float ,String, Text,Boolean, Date, DateTime, Enum, ForeignKey, Time, JSON
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import datetime
from app.database.connection import Base

class Ong(Base):
    __tablename__ = 'ong'
    id = Column(Integer, primary_key = True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'), nullable = False, unique = True)
    nome = Column(String(255), nullable = False)
    cnpj = Column(String(14), nullable = False, unique = True)
    cep = Column(String(8),nullable = True)
    rua = Column(String(255), nullable = False)
    bairro = Column(String(255), nullable = False)
    cidade = Column(String(255), nullable = False)
    estado = Column(String(255), nullable = False)
    numero = Column (String(20), nullable = True)
    complemento = Column(String(255), nullable = True)
    telefone = Column(String(11), nullable = False)
    email = Column(String(255), nullable = False)
    sobre = Column(Text, nullable= False)
    instagram = Column(String(255), nullable = True)
    facebook = Column(String(255), nullable = True)
    site = Column(String(255), nullable = True)
    hora_abertura = Column(Time, nullable=False)
    hora_fechamento = Column(Time, nullable=False)
    dias_funcionamento = Column(JSON, default=[], nullable = False)
    data_cadastro = Column(DateTime, server_default=func.now(), nullable=False)
    data_edicao = Column(DateTime, onupdate=func.now(), nullable=True)    
    ativa = Column(Boolean, default = True ,nullable = False)
    dono = relationship("Usuario", back_populates="ong")
    voluntarios = relationship("VoluntarioOng", back_populates="ong")

class VoluntarioOng(Base):
    __tablename__ = "voluntario_ong"
    id = Column(Integer, primary_key = True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'), nullable = False, unique = True)
    ong_id = Column(Integer, ForeignKey('ong.id'), nullable = False)
    usuario = relationship("Usuario", back_populates = "vinculo_voluntario")
    ong = relationship("Ong", back_populates = "voluntarios")