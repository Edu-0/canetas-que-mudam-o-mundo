from fastapi import FastAPI
from app.routes import users
from app.database.connection import engine  # Importe o motor que você criou
from app.models.user import Base      # Importe a Base declarativa dos seus modelos

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(users.router)