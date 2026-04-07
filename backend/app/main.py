from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # para permitir requisições do frontend
from app.routes import users
from app.database.connection import engine  
from app.models.user import Base      

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware( # configura o CORS para permitir requisições do frontend
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # restringe para a origem confiável do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)