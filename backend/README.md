# Backend - Canetas que Mudam o Mundo

API REST com FastAPI + PostgreSQL via SQLAlchemy.

## Setup

1. Crie um ambiente virtual (Python 3.9+):
```bash
python -m venv venv
source venv/bin/activate  # Unix/macOS
# ou
venv\Scripts\activate  # Windows
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Configure as variáveis de ambiente (copie de `.env.example`):
```bash
cp .env.example .env
```

## Desenvolvimento

```bash
python -m uvicorn app.main:app --reload
```

A API roda em `http://localhost:8000` com docs em `http://localhost:8000/docs`.

## Estrutura

```
app/
├── main.py          # Ponto de entrada
├── routes/          # Endpoints da API
├── models/          # Modelos de dominio
├── schemas/         # Schemas Pydantic
├── services/        # Lógica de negócio
├── database/        # Configuração do banco
└── core/            # Configurações
```

## Dependências

- **fastapi**: Framework web
- **uvicorn**: Servidor ASGI
- **SQLAlchemy**: ORM e camada de acesso ao banco
- **pydantic**: Validação de dados
- **python-dotenv**: Variáveis de ambiente
