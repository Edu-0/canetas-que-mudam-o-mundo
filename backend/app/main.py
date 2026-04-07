from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, demo_files, users
from app.database.connection import engine  

from app.models.user import Base
from app.models import auth as auth_model 

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(demo_files.router)