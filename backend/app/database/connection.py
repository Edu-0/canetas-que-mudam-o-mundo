from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy_utils import database_exists, create_database
from typing import Annotated
from fastapi import Depends

def get_engine(user, passwd, host, port, db):
    url = f"postgresql://{user}:{passwd}@{host}:{port}/{db}"
    
    if not database_exists(url):
        create_database(url)
        print(f"Banco de dados '{db}' criado com sucesso!")
    
    engine = create_engine(url, pool_size=50, echo=False)
    return engine


USUARIO = "postgres" 
SENHA = "admin"
HOST = "localhost"
PORTA = "5432"
NOME_BANCO = "postgres"

engine = get_engine(USUARIO, SENHA, HOST, PORTA, NOME_BANCO)

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