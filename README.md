# Canetas que Mudam o Mundo

Plataforma full stack para triagem e validação de dados, com backend em FastAPI e frontend em React + Vite.

## Visão Geral

O repositório está dividido em duas partes principais:

- `backend/`: API REST, autenticação, persistência em PostgreSQL, upload de arquivos e OCR.
- `frontend/`: interface em React com rotas de cadastro, conta e edição de conta.

## Execução Rápida

### Opção 1: iniciar tudo pelo repositório raiz

No Windows, o script raiz abre backend e frontend em janelas separadas:

```powershell
npm run dev
```

Esse fluxo usa o script [start-dev.ps1](start-dev.ps1) e assume:

- ambiente conda chamado `py311` para o backend;
- frontend com dependências instaladas via `npm install`.

Ao final, a aplicação fica disponível em:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

### Opção 2: subir manualmente

Backend:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Pré-requisitos

- Python 3.11+ recomendado para o backend.
- Node.js 18+ recomendado para o frontend.
- PostgreSQL disponível localmente ou via URL remota.
- Credenciais do Firebase configuradas se você for usar upload de arquivos.

## Configuração do Backend

O backend lê variáveis de ambiente do arquivo `.env` dentro de `backend/`.

Use uma das duas estratégias de banco:

- `DATABASE_URL` com a string completa de conexão.
- Ou `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` e `DB_NAME`.

Também são usados:

- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `FIREBASE_CREDENTIALS`
- `FIREBASE_STORAGE_BUCKET`

Exemplo mínimo:

```env
DATABASE_URL=postgresql+psycopg2://usuario:senha@localhost:5432/nome_banco
SECRET_KEY=troque-esta-chave
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FIREBASE_CREDENTIALS=app/credentials/firebase/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=seu-bucket.appspot.com
```

## Estrutura do Projeto

### Backend

```text
backend/
  app/
    main.py
    routes/
    models/
    schemas/
    services/
    database/
    core/
  requirements.txt
```

### Frontend

```text
frontend/
  src/
    components/
    pages/
    services/
    hooks/
    context/
    utils/
    assets/
    App.tsx
    main.tsx
  public/
  package.json
  vite.config.js
```

## Documentação Detalhada

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)