# Frontend - Canetas que Mudam o Mundo

Aplicação cliente construída com React + TypeScript e Vite. Fornece as interfaces de cadastro, login, conta do usuário e painéis administrativos.

## Stack e dependências

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios (cliente HTTP)
- ESLint / Prettier (convenções de código)

## Instalação

```bash
cd frontend
npm install
```

## Configuração

Por padrão o cliente usa `http://localhost:8000` como base para as requisições à API; ajuste em [src/services/api.tsx](frontend/src/services/api.tsx) se necessário. Não há um `.env.example` no momento — recomenda-se adicionar um para `VITE_API_BASE_URL`.

## Desenvolvimento

```bash
npm run dev
```

Aplicação disponível em `http://localhost:5173`.

## Scripts úteis

- `npm run dev` — inicia Vite em desenvolvimento.
- `npm run build` — gera build de produção em `dist/`.
- `npm run preview` — pré-visualiza o build.
- `npm run lint` — executa ESLint.

## Estrutura do projeto (principais pastas e responsabilidades)

- `src/components/` — componentes reutilizáveis (`Botao.tsx`, `CardONG.tsx`, `Carrossel.tsx`, etc.).
- `src/pages/` — páginas do roteamento (ex.: `Inicio.tsx`, `Doar.tsx`, `Triagem.tsx`).
- `src/context/` — provedores de estado global (`UserContext`, `DoacaoContext`, `OngContext`).
- `src/services/` — cliente HTTP e integrações com a API (`api.tsx`).
- `src/hooks/` — hooks customizados (fetch, filtros, avisos de alterações não salvas).
- `src/assets/` — imagens e recursos estáticos.

Arquivos importantes:

- [src/main.tsx](frontend/src/main.tsx) — ponto de entrada.
- [src/App.tsx](frontend/src/App.tsx) — definição de rotas.
- [src/services/api.tsx](frontend/src/services/api.tsx) — configuração do cliente Axios.
- [src/context/UserContext.tsx](frontend/src/context/UserContext.tsx) — estado de autenticação e usuário.

## Rotas (resumo)

As rotas principais estão registradas em [src/App.tsx](frontend/src/App.tsx). Entre elas:

- Públicas: `/`, `/logar`, `/cadastro`
- Área do usuário: `/conta`, `/conta/editar`, `/conta/cadastro-beneficiario`, `/conta/quiz-voluntario`
- Funcionalidades em desenvolvimento (ex.: `/doar`, `/triagem`, `/relatorio`)

## Boas práticas

- Centralize a URL da API em `src/services/api.tsx` ou exponha via `VITE_API_BASE_URL`.
- Use os contexts em `src/context/` para manter estado compartilhado entre páginas.
- Adicione `env.example` com `VITE_API_BASE_URL` para facilitar contribuições.

## Testes

- Atualmente não há suíte de testes incluída; considere adicionar testes unitários com `vitest` ou `jest`.

---

Se preferir, posso criar um `frontend/.env.example` e atualizar `src/services/api.tsx` para ler `import.meta.env.VITE_API_BASE_URL`.
