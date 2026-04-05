from sqlalchemy import Column, Integer, Float ,String, Text,Boolean, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
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
    funcao = relationship("UsuarioFuncao", back_populates="usuario")
    documento = relationship("DocumentoUsuario", back_populates="usuario")
    perfil_beneficiario = relationship("UsuarioBeneficiario", back_populates="usuario")

class UsuarioBeneficiario(Base):
    __tablename__ = 'usuario_beneficiario'
    id= Column(Integer, primary_key= True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'), nullable = False, unique = True)
    qtd_familiares = Column(Integer, nullable= False)
    auxilio = Column(Enum(BeneficiosUsuario), default = BeneficiosUsuario.NENHUM, nullable= False)
    concordou_termos = Column(Boolean, default=False, nullable= False)
    data_preenchimento = Column(DateTime, default=datetime.datetime.now)
    familia = relationship("FamiliaBeneficiario", back_populates = "perfil")
    usuario = relationship("Usuario", back_populates="perfil_beneficiario")


class FamiliaBeneficiario(Base):
    __tablename__ = 'familia_beneficiario'
    id = Column(Integer, primary_key= True)
    perfil_id = Column(Integer, ForeignKey('usuario_beneficiario.id'), nullable= False)
    nome = Column(String(255), nullable= False)
    parentesco = Column(String(100), nullable= False)
    data_nascimento = Column(Date, nullable= False)
    renda = Column(Float, nullable = False)
    perfil = relationship("UsuarioBeneficiario", back_populates="familia")


class DocumentoUsuario(Base):
    __tablename__ = 'documento_usuario'
    id = Column(Integer, primary_key = True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'))
    tipo_documento = Column(String(50))
    nome_original = Column(String(255))
    caminho_arquivo = Column(Text)
    data_upload = Column(DateTime, default=datetime.datetime.now)
    usuario = relationship("Usuario", back_populates = "documento")



class UsuarioFuncao(Base):
    __tablename__ = 'funcao_usuario'
    id = Column(Integer, primary_key = True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'), nullable= False)
    tipo_usuario =  Column(Enum(TipoUsuario), default = TipoUsuario.GENERICO)
    usuario = relationship("Usuario", back_populates = "funcao")

