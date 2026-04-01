from sqlalchemy import Column, Integer, String, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
import datetime
import enum

# Traduz as classes para SQL
Base = declarative_base()

class TipoUsuario(enum.Enum):
    GENERICO = "Comum"
    COORDENADOR_PROCESSOS = "Coordenador de Processos"
    RESPONSAVEL_BENEFICIARIO = "Responsável pelo beneficiário"
    DOADOR = "Doador"
    TRIAGEM = "Voluntário da triagem"

class Usuario(Base):
    __tablename__ = 'usuario'
    id = Column(Integer, primary_key = True)
    nome_completo = Column(String)
    cpf = Column(String)
    email = Column(String)
    senha = Column(String)
    data_nascimento = Column(Date)
    funcao = relationship("UsuarioFuncao", back_populates="usuario")
    endereco = relationship("EnderecoUsuario", back_populates= "usuario")
    documento = relationship("DocumentoUsuario", back_populates="usuario")

class DocumentoUsuario(Base):
    __tablename__ = 'documento_usuario'
    id = Column(Integer, primary_key = True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'))
    nome_original = Column(String)
    caminho_arquivo = Column(String)
    data_upload = Column(DateTime, default=datetime.datetime.now)
    usuario = relationship("Usuario", back_populates = "documento")


class EnderecoUsuario(Base):
    __tablename__ = 'endereco_usuario'
    id = Column(Integer, primary_key = True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'))  
    cep = Column(String)
    endereco = Column(String)
    tipo_endereco = Column(String)
    numero = Column(String)
    complemento = Column(String)
    usuario = relationship("Usuario", back_populates = "endereco")


class UsuarioFuncao(Base):
    __tablename__ = 'funcao_usuario'
    id = Column(Integer, primary_key = True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'))
    tipo_funcao =  Column(Enum(TipoUsuario), default = TipoUsuario.GENERICO)
    usuario = relationship("Usuario", back_populates = "funcao")

