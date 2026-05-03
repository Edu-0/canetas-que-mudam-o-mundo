import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session
from sqlalchemy_utils import database_exists, create_database
from typing import Annotated
from fastapi import Depends

load_dotenv()


def get_engine(database_url=None, user=None, passwd=None, host=None, port=None, db=None):
    if database_url:
        url = database_url
    else:
        url = URL.create(
            drivername="postgresql+psycopg2",
            username=user,
            password=passwd,
            host=host,
            port=int(port) if port else 5432,
            database=db,
        )
    
    if not database_exists(url):
        create_database(url)
        print(f"Banco de dados '{db}' criado com sucesso!")
    
    engine = create_engine(url, pool_size=50, echo=False)
    return engine


DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
USUARIO = os.getenv("DB_USER", "").strip()
SENHA = os.getenv("DB_PASS", "").strip()
HOST = os.getenv("DB_HOST", "localhost").strip()
PORTA = os.getenv("DB_PORT", "5432").strip()
NOME_BANCO = os.getenv("DB_NAME", "").strip()

engine = get_engine(
    database_url=DATABASE_URL if DATABASE_URL else None,
    user=USUARIO if not DATABASE_URL else None,
    passwd=SENHA if not DATABASE_URL else None,
    host=HOST if not DATABASE_URL else None,
    port=PORTA if not DATABASE_URL else None,
    db=NOME_BANCO if not DATABASE_URL else None,
)

def get_session():
    #A Session is what stores the objects in memory and keeps track of any changes needed in the data, 
    # then it uses the engine to communicate with the database.

    # With é um gerenciador de contexto, garante que a conexao seja encerrada
    # independente de sucesso ou falha
    with Session(engine) as session:
        #yield will provide a new Session for each request. 
        # Ele pausa a fun até que a rota termine, quando retorna o with finaliza a sessão
        #This is what ensures that we use a single session per request.
        yield session
        
#Annoted: simplify the rest of the code that will use this dependency.
#Ao inves de usar db: Session = Depends(get_session) usa apenas db:SessionDep
SessionDep = Annotated[Session, Depends(get_session)]