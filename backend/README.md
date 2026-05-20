# Backend - Canetas que Mudam o Mundo

API REST construída com FastAPI responsável por autenticação, gerenciamento de usuários, upload e processamento OCR de documentos, persistência em PostgreSQL e integração com Firebase Storage.

## Requisitos

- Python 3.11+
- PostgreSQL acessível (local ou remoto)
- Dependências listadas em `backend/requirements.txt` (inclui pacotes nativos para OCR)
- Credenciais do Firebase para Storage (quando necessário)

## Instalação rápida

Usando `venv`:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

No Windows este projeto também suporta execução via Conda; o script raiz usa um ambiente `py311` por conveniência.

## Configuração (variáveis de ambiente)

Crie `backend/.env` com as variáveis principais:

- `DATABASE_URL` ou `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`
- `SECRET_KEY`, `ALGORITHM` (p.ex. `HS256`), `ACCESS_TOKEN_EXPIRE_MINUTES`
- `FIREBASE_CREDENTIALS` (caminho para JSON), `FIREBASE_STORAGE_BUCKET`

Exemplo mínimo (`backend/.env`):

```env
DATABASE_URL=postgresql+psycopg2://usuario:senha@localhost:5432/nome_banco
SECRET_KEY=troque-esta-chave
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FIREBASE_CREDENTIALS=app/credentials/firebase/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=seu-bucket.appspot.com
```

## Executando o servidor

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Docs interativas (quando rodando):

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Estrutura e localização de responsabilidades

- `app/main.py` — inicialização da aplicação e inclusão de routers.
- `app/core/` — configurações centrais: `config.py`, `security.py`, `firebase.py`, `deps_auth.py`.
- `app/database/connection.py` — criação da engine SQLAlchemy e sessão.
- `app/models/` — modelos ORM (`user.py`, `doacao.py`, `estoque.py`, `ong.py`, etc.).
- `app/schemas/` — pydantic schemas de entrada/saída.
- `app/routes/` — rotas agrupadas por domínio (`auth.py`, `users.py`, `doacao.py`, `estoque.py`, `ong.py`, `password.py`).
- `app/services/` — lógica de negócio e integrações (OCR, Firebase upload, regras de doação/ONG).
- `app/templates/` — templates HTML para emails (recuperar senha).
- `app/utils/funcoes.py` — utilitários compartilhados.

Arquivos importantes:

- [app/main.py](backend/app/main.py)
- [app/core/config.py](backend/app/core/config.py)
- [app/routes/auth.py](backend/app/routes/auth.py)
- [app/services/firebase_storage.py](backend/app/services/firebase_storage.py)

## Rotas principais (resumo)

- Autenticação: `/auth/*` — login, logout, refresh e `me`.
- Usuários: `/usuario/*` — criação, leitura e atualização de perfis e famílias.
- Arquivos/OCR: `/files/*` — upload, remoção e endpoints de OCR (identidade, comprovante de renda, validação).

Consulte os módulos de rota em `backend/app/routes/` para a lista completa de endpoints.

## Rotas (detalhadas)

Abaixo uma lista consolidada dos endpoints expostos pelo backend (método — caminho — descrição curta).

- Auth
	- `POST /auth/login` — autenticação, retorna token JWT.
	- `POST /auth/logout` — revoga token atual (logout).
	- `GET /auth/me` — retorna dados do usuário autenticado.

- Usuários (`/usuario`)
	- `GET /usuario/` — listar usuários (permissão necessária).
	- `GET /usuario/perfil/me` — obter perfil do usuário atual.
	- `DELETE /usuario/deletar-conta/{usuario_id}` — excluir conta do usuário (apenas próprio usuário).
	- `GET /usuario/{usuario_id}` — obter usuário por id.
	- `POST /usuario/generico` — criar usuário genérico (cadastro básico).
	- `PUT /usuario/{usuario_id}` — atualizar dados do usuário.
	- `POST /usuario/{usuario_id}/responsavel` — transformar/registrar usuário como responsável (envio de documento).
	- `PUT /usuario/{perfil_id}/responsavel` — atualizar perfil de responsável.
	- `POST /usuario/{responsavel_id}/documentacao` — upload de documento para responsável.
	- `GET /usuario/{responsavel_id}/documentacao` — listar documentos de um responsável.
	- `DELETE /usuario/documentacao/{documento_id}` — marcar documento de usuário para exclusão.
	- `GET /usuario/familia/all` — listar familiares do responsável autenticado.
	- `POST /usuario/{responsavel_id}/familia-responsavel` — cadastrar familiares via payload JSON + arquivos.
	- `PUT /usuario/{familia_id}/familia-responsavel` — atualizar familiar.
	- `POST /usuario/familia/{familiar_id}/documentacao` — upload documento de familiar.
	- `GET /usuario/familia/{familiar_id}/documentacao` — listar documentos de familiar.
	- `DELETE /usuario/familia/{familiar_id}` — deletar registro de familiar.
	- `DELETE /usuario/familia/documentacao/{documento_id}` — marcar documento de familiar para exclusão.
	- `POST /usuario/quiz/triagem` — salvar resultado de triagem (concede papel de triagem quando aprovado).
	- `PUT /usuario/{usuario_id}/funcao` — atualizar funções/perfis do usuário.
	- `DELETE /usuario/{usuario_id}/funcao/{tipo_funcao}` — remover função do usuário.

- Doações (`/doacoes`)
	- `POST /doacoes/` — criar doação (JSON).
	- `POST /doacoes/formulario` — criar doação via formulário com fotos (multipart).
	- `GET /doacoes/` — listar doações (filtros por data/status disponíveis).
	- `GET /doacoes/{doacao_id}` — obter doação por id.
	- `POST /doacoes/itens/{item_doacao_id}/avaliacoes` — avaliar item na triagem.
	- `PATCH /doacoes/itens/{item_doacao_id}/status` — alterar status de item doação.
	- `POST /doacoes/{doacao_id}/notificar-pre-aprovacao` — notificar doador sobre pré-aprovação (envia email).

- Arquivos e OCR (`/files`)
	- `POST /files/upload` — upload simples para Firebase Storage.
	- `POST /files/ocr/comprovante-renda` — validar comprovante de renda via OCR.
	- `POST /files/ocr/identidade` — validar identidade via OCR.
	- `POST /files/validar-documento-ocr` — valida ambos documentos e retorna resumo.
	- `DELETE /files/delete` — remover arquivo do storage por URL.

- ONG (`/ong`)
	- `GET /ong/` — listar ONGs.
	- `GET /ong/minha-ong` — obter ONG vinculada ao usuário atual.
	- `GET /ong/{ong_id}/voluntarios` — listar voluntários de uma ONG.
	- `GET /ong/convite/validar` — validar token de convite (query param `token`).
	- `POST /ong/cadastro-ong` — criar ONG (usuário genérico -> coordenador).
	- `PUT /ong/editar-ong/{ong_id}` — atualizar ONG.
	- `DELETE /ong/deletar-voluntario/{voluntario_id}` — remover voluntário de ONG.
	- `POST /ong/gerar-token-ong/{ong_id}` — gerar token de convite para ONG.
	- `GET /ong/listar-token-ong/{ong_id}` — listar tokens ativos de ONG.
	- `DELETE /ong/desativar-token-ong/{ong_id}/{token_id}` — desativar token de ONG.

- Estoque (`/estoque`)
	- `GET /estoque/` — listar itens disponíveis no estoque (filtros por data/ordem).

- Senha/Recuperação (`/password`)
	- `POST /password/recuperar-senha` — solicitar link de recuperação por email.
	- `POST /password/redefinir-senha` — redefinir senha usando token recebido.

Para ver implementações e descrições mais detalhadas, consulte os arquivos em `backend/app/routes/`.

## Observações técnicas

- Ao subir, o projeto cria tabelas via SQLAlchemy `Base.metadata.create_all(...)` — para produção considere usar migrações (alembic).
- O processamento OCR usa `paddleocr` e `paddlepaddle` e pode requerer dependências nativas; no Windows recomenda-se usar o ambiente `py311` provido nos scripts.
- Uploads de arquivos enviam para Firebase Storage quando as credenciais estão configuradas.

## Dependências relevantes

- `fastapi`, `uvicorn[standard]`
- `sqlalchemy`, `sqlalchemy-utils`, `psycopg2-binary`
- `python-jose[cryptography]` (JWT)
- `firebase-admin`
- `paddleocr`, `paddlepaddle`, `pypdfium2`, `Pillow`

## Debug e problemas comuns

- Banco não conecta: verifique `DATABASE_URL` ou variáveis `DB_*` e se o serviço PostgreSQL está rodando.
- Erro em upload: confira `FIREBASE_CREDENTIALS` e permissões do bucket.
- OCR falhando: confirme instalação e versões de `paddlepaddle`; no Windows prefira o ambiente `py311`.

## Testes e desenvolvimento local

- Não há testes automatizados incluídos no repositório atualmente; recomenda-se adicionar testes unitários e de integração para serviços críticos.

---

Se quiser, posso adicionar exemplos de requisições cURL para endpoints principais ou esboçar um `docker-compose` para banco + app.
