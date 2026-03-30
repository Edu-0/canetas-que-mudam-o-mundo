# Canetas que Mudam o Mundo

Repositório para trabalho de Engenharia de Software II - Full Stack com FastAPI + React.

## Estrutura do Projeto

### Backend (FastAPI)
```
backend/
  app/
    main.py        # ponto de entrada
    routes/        # endpoints (users, auth, etc)
    models/        # modelos do banco (ORM)
    schemas/       # validação (Pydantic)
    services/      # lógica de negócio
    database/      # conexão com banco
    core/          # configs (env, segurança)
  requirements.txt
```

### Frontend (React + Vite)
```
frontend/
  src/
    components/   # UI reutilizável (botões, inputs)
    pages/        # telas (Home, Login, etc)
    services/     # chamadas API
    hooks/        # lógica reutilizável
    context/      # estado global
    utils/        # funções auxiliares
    assets/       # imagens, ícones
    App.jsx
    main.jsx
  public/
  package.json
  vite.config.js
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

O backend roda em `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

O frontend roda em `http://localhost:5173`

## Documentação
- [Backend](./backend/README.md)
- [Frontend](./frontend/README.md)