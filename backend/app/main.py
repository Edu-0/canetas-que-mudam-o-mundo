from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from app.routes import auth, demo_files, password, users
from app.database.connection import engine  

from app.models.user import Base
from app.models import auth as auth_model 

Base.metadata.create_all(bind=engine)


def sync_sqlite_schema() -> None:
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)

    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue

            existing_columns = {
                column["name"] for column in inspector.get_columns(table.name)
            }

            for column in table.columns:
                if column.name in existing_columns:
                    continue

                column_type = column.type.compile(dialect=engine.dialect)
                conn.exec_driver_sql(
                    f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {column_type}'
                )


        conn.exec_driver_sql(
            'UPDATE usuario SET data_cadastro = CURRENT_TIMESTAMP WHERE data_cadastro IS NULL'
        )
        conn.exec_driver_sql(
            'UPDATE usuario SET data_edicao_conta = CURRENT_TIMESTAMP WHERE data_edicao_conta IS NULL'
        )
        conn.exec_driver_sql(
            'UPDATE usuario_responsavel SET data_preenchimento_termos = CURRENT_TIMESTAMP WHERE data_preenchimento_termos IS NULL'
        )
        conn.exec_driver_sql(
            'UPDATE familia_responsavel SET data_cadastro = CURRENT_TIMESTAMP WHERE data_cadastro IS NULL'
        )
        conn.exec_driver_sql(
            'UPDATE familia_responsavel SET data_edicao = CURRENT_TIMESTAMP WHERE data_edicao IS NULL'
        )
        conn.exec_driver_sql(
            'UPDATE documento_usuario SET data_upload = CURRENT_TIMESTAMP WHERE data_upload IS NULL'
        )
        conn.exec_driver_sql(
            'UPDATE documento_familia SET data_upload = CURRENT_TIMESTAMP WHERE data_upload IS NULL'
        )
        conn.exec_driver_sql(
            'UPDATE usuario_triagem SET data_realizacao = CURRENT_TIMESTAMP WHERE data_realizacao IS NULL'
        )


sync_sqlite_schema()

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
app.include_router(password.router)
app.include_router(demo_files.router)