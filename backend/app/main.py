from fastapi import FastAPI
from app.routes import users
from app.database.connection import engine  
from app.models.user import Base      

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(users.router)