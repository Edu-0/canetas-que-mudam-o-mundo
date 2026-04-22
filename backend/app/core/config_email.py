import pathlib 
from fastapi_mail import ConnectionConfig
from pydantic import EmailStr
import os

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USER", "email@gmail.com"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "senha_de_app"),
    MAIL_FROM = os.getenv("MAIL_FROM", "email@gmail.com"),
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True,

    TEMPLATE_FOLDER = pathlib.Path(__file__).parent.parent / "templates",
)