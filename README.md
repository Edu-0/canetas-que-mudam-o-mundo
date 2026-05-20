## Canetas que Mudam o Mundo

Plataforma full‑stack para triagem, validação e gerenciamento de dados sociais. Esta base reúne uma API em Python (FastAPI) e um cliente web em React + TypeScript.

**Objetivo**: facilitar cadastro, verificação documental (OCR), gestão de doações e triagem social para organizações parceiras.

**Principais tecnologias**: Python 3.11, FastAPI, SQLAlchemy, PostgreSQL, Firebase Storage, PaddleOCR; React 18, TypeScript, Vite, Tailwind CSS, Axios.

## Estrutura do repositório

- [backend/](backend/README.md) — API REST em FastAPI (autenticação, upload, OCR, modelos e serviços). Ver documentação específica.
- [frontend/](frontend/README.md) — Aplicação cliente em React + TypeScript (componentes, páginas e contextos).
- `start-dev.ps1` — script Windows que abre simultaneamente backend e frontend (usa Conda por padrão).
- `package.json` — scripts de conveniência para desenvolvimento (raiz).

## Conteúdo desta documentação

Este README apresenta visão geral, pré-requisitos e comandos rápidos. As seções específicas de backend e frontend estão em seus respectivos READMEs.

## Pré-requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL (local ou remoto)
- (Opcional) Conda para o fluxo `start-dev.ps1`
- Credenciais do Firebase (quando usar upload/Storage)

## Quickstart — desenvolvimento (modo rápido)

Opção A — rodar ambos com o script (Windows):

```powershell
npm run dev
```

Esse comando executa `start-dev.ps1` que abre o backend e o frontend em janelas separadas. Parâmetros úteis:
- `BackendEnv` (padrão `py311`) — nome do ambiente Conda a usar.
- `-NoBrowser` — não abre o navegador automaticamente.

Opção B — executar manualmente

Backend (ex.: venv ou Conda):

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Padrões de portas:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Swagger (docs): `http://localhost:8000/docs`

## Variáveis de ambiente importantes (resumo)

- `DATABASE_URL` ou `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`
- `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `FIREBASE_CREDENTIALS`, `FIREBASE_STORAGE_BUCKET`

Um exemplo mínimo pode ser encontrado em `backend/README.md` (seção de configuração).

## Boas práticas para desenvolvimento

- Ajuste o endereço da API no cliente em [frontend/src/services/api.tsx](frontend/src/services/api.tsx).
- Mantenha credenciais fora do repositório; use `.env` ou variáveis de ambiente.
- Para trabalhar com OCR no Windows, siga o ambiente `py311` (scripts e notas em `backend/README.md`).

## Próximos passos e contribuições

- Abra issues para bugs e propostas de melhoria.
- Para mudanças no banco, considere adicionar scripts de migração (alembic não está incluído atualmente).
- Se quiser, posso unificar formato e exemplos entre os READMEs e adicionar um `CONTRIBUTING.md`.

---

Para documentação mais detalhada veja as páginas:

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)