from sqlalchemy import Column, Integer, Float ,String, Text,Boolean, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import datetime
from app.core.enums import BeneficiosUsuario, TipoUsuario

# Traduz as classes para SQL
Base = declarative_base()

class Usuario(Base):
    __tablename__ = 'usuario'
    id = Column(Integer, primary_key = True)
    nome_completo = Column(String(255), nullable= False)
    data_nascimento = Column(Date, nullable= False)
    cpf = Column(String(11), unique= True, nullable= False)
    cep = Column(String(8), nullable= False)
    telefone = Column(String(11), nullable = False)
    email = Column(String(255), unique = True, nullable= False)
    senha = Column(String(255), nullable= False)
    data_cadastro = Column(DateTime, server_default=func.now(), nullable=False)
    data_edicao_conta = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    ativo = Column(Boolean, nullable=False)
    funcao = relationship("UsuarioFuncao", back_populates="usuario")
    perfil_responsavel = relationship("UsuarioResponsavel", back_populates="usuario", uselist=False)

class UsuarioResponsavel(Base):
    __tablename__ = 'usuario_responsavel'
    id = Column(Integer, primary_key= True)
    responsavel_id = Column(Integer, ForeignKey('usuario.id'), nullable = False, unique = True)
    qtd_familiares = Column(Integer, nullable= False)
    auxilio = Column(Enum(BeneficiosUsuario), default = BeneficiosUsuario.NENHUM, nullable= False)
    concordou_termos = Column(Boolean, default=False, nullable= False)
    data_preenchimento_termos = Column(DateTime, default=datetime.datetime.now)
    data_edicao_conta = Column(DateTime, default=datetime.datetime.now)
    documentacao_aprovada = Column(Boolean, default = False, nullable=False)
    ativo = Column(Boolean, nullable=False)
    documento = relationship("DocumentoUsuario", back_populates="usuario_responsavel")
    familia = relationship("FamiliaResponsavel", back_populates = "perfil")
    usuario = relationship("Usuario", back_populates="perfil_responsavel")


class FamiliaResponsavel(Base):
    __tablename__ = 'familia_responsavel'
    id = Column(Integer, primary_key= True)
    responsavel_id = Column(Integer, ForeignKey('usuario_responsavel.id'), nullable= False)
    nome = Column(String(255), nullable= False)
    cpf = Column(String(11), nullable= False)
    parentesco = Column(String(100), nullable= False)
    data_nascimento = Column(Date, nullable= False)
    renda = Column(Float, nullable = False)
    beneficiario = Column(Boolean, nullable = False, default = False)
    data_cadastro = Column(DateTime, server_default=func.now(), nullable=False)
    data_edicao = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False) 
    ativo = Column(Boolean, nullable=False)
    documento = relationship ("DocumentoFamilia", back_populates="familiar")
    perfil = relationship("UsuarioResponsavel", back_populates="familia")


class DocumentoUsuario(Base):
    __tablename__ = 'documento_usuario'
    id = Column(Integer, primary_key = True)
    responsavel_id = Column(Integer, ForeignKey('usuario_responsavel.id'))
    tipo_documento = Column(String(50))
    nome_original = Column(String(255))
    caminho_arquivo = Column(Text)
    data_upload = Column(DateTime, default=datetime.datetime.now)
    pendente_exclusao = Column(Boolean, nullable=False, default=False)
    usuario_responsavel = relationship("UsuarioResponsavel", back_populates = "documento")

class DocumentoFamilia(Base):
    __tablename__ = "documento_familia"
    id = Column(Integer, primary_key = True)
    familiar_id = Column(Integer, ForeignKey('familia_responsavel.id'))
    tipo_documento = Column(String(50))
    nome_original = Column(String(255))
    caminho_arquivo = Column(Text)
    data_upload = Column(DateTime, default=datetime.datetime.now)
    pendente_exclusao = Column(Boolean, nullable=False, default=False)
    familiar = relationship("FamiliaResponsavel", back_populates = "documento")    

class UsuarioFuncao(Base):
    __tablename__ = 'funcao_usuario'
    id = Column(Integer, primary_key = True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'), nullable= False)
    tipo_usuario =  Column(Enum(TipoUsuario), default = TipoUsuario.GENERICO)
    usuario = relationship("Usuario", back_populates = "funcao")

