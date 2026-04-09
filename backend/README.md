# Backend - Canetas que Mudam o Mundo

API REST em FastAPI para autenticação, usuários, upload de arquivos e validação OCR.

## Requisitos

- Python 3.11+ recomendado.
- PostgreSQL acessível localmente ou via `DATABASE_URL`.
- Dependências nativas para OCR instaladas pelo `pip` do ambiente selecionado.
- Credenciais do Firebase configuradas se os endpoints de arquivos forem utilizados.

## Instalação

Crie e ative um ambiente virtual, depois instale as dependências:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

No Windows com conda, o script raiz assume um ambiente chamado `py311`.

## Configuração

Crie um arquivo `.env` dentro de `backend/`.

### Banco de dados

Use `DATABASE_URL` se quiser passar a string completa de conexão. Se ela não estiver definida, o backend tenta montar a conexão com:

- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`

### Autenticação

- `SECRET_KEY`: chave usada para gerar tokens.
- `ALGORITHM`: algoritmo JWT, com padrão `HS256`.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: tempo de expiração do token em minutos.

### Firebase

- `FIREBASE_CREDENTIALS`: caminho para o arquivo JSON da service account.
- `FIREBASE_STORAGE_BUCKET`: nome do bucket do Storage.

Exemplo:

```env
DATABASE_URL=postgresql+psycopg2://usuario:senha@localhost:5432/nome_banco
SECRET_KEY=troque-esta-chave
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FIREBASE_CREDENTIALS=app/credentials/firebase/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=seu-bucket.appspot.com
```

## Como Executar

```bash
python -m uvicorn app.main:app --reload
```

O backend fica em `http://localhost:8000`.

Endpoints de documentação:

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Rotas Principais

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Usuários

- `GET /usuario/`
- `GET /usuario/{usuario_id}`
- `POST /usuario/generico`
- `POST /usuario/{usuario_id}/responsavel`
- `POST /usuario/{perfil_id}/familia-responsavel`
- `PUT /usuario/{usuario_id}`
- `PUT /usuario/{perfil_id}/responsavel`
- `PUT /usuario/{familia_id}/familia-responsavel`
- `PUT /usuario/{documento_id}/documento`

### Arquivos e OCR

- `POST /files/upload`
- `DELETE /files/delete`
- `POST /files/ocr/comprovante-renda`
- `POST /files/ocr/identidade`
- `POST /files/ocr/validar-documento-ocr`

## Estrutura do Projeto

```text
app/
	main.py
	routes/
	models/
	schemas/
	services/
	database/
	core/
```

## Observações Técnicas

- As tabelas são criadas automaticamente na inicialização com `Base.metadata.create_all(...)`.
- O CORS está liberado para todas as origens no ambiente atual.
- O OCR usa `paddleocr`, `paddlepaddle`, `pypdfium2` e `Pillow`.
- O suporte a PDF processa a primeira página do arquivo.

## Dependências Relevantes

- `fastapi`: framework web.
- `uvicorn[standard]`: servidor ASGI.
- `sqlalchemy` e `sqlalchemy-utils`: acesso e criação do banco.
- `psycopg2-binary`: driver PostgreSQL.
- `python-jose[cryptography]`: JWT.
- `firebase-admin`: Storage do Firebase.
- `paddleocr`, `paddlepaddle`, `pypdfium2`: OCR e leitura de PDF.

## Problemas Comuns

- Se o banco não subir, confirme se `DATABASE_URL` ou `DB_*` estão corretos e se o PostgreSQL está acessível.
- Se o upload falhar, verifique `FIREBASE_CREDENTIALS` e `FIREBASE_STORAGE_BUCKET`.
- Se o OCR falhar no Windows, rode com o ambiente `py311` e confirme as dependências de OCR instaladas.
