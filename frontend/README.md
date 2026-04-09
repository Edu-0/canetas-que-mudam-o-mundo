# Frontend - Canetas que Mudam o Mundo

Interface em React + TypeScript com Vite para cadastro, conta e edição de conta.

## Stack

- React 18
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS

## Instalação

```bash
npm install
```

Não há arquivo `.env.example` atualmente. A integração com a API está configurada diretamente em [src/services/api.tsx](src/services/api.tsx).

## Desenvolvimento

```bash
npm run dev
```

O frontend sobe em `http://localhost:5173`.

## Scripts

- `npm run dev`: inicia o Vite em modo desenvolvimento.
- `npm run build`: gera o build de produção em `dist/`.
- `npm run preview`: pré-visualiza o build gerado.
- `npm run lint`: executa o ESLint no projeto.

## Integração com o Backend

O cliente HTTP usa como base `http://localhost:8000` em [src/services/api.tsx](src/services/api.tsx).

Se o backend estiver em outro host ou porta, ajuste esse arquivo antes de subir o frontend.

## Rotas Ativas

As rotas atualmente registradas em [src/App.tsx](src/App.tsx) são:

- `/`
- `/cadastro`
- `/conta`
- `/conta/editar`

Outras páginas já existem no projeto, mas ainda estão comentadas no roteamento.

## Estrutura do Código

```text
src/
	components/
	context/
	hooks/
	pages/
	services/
	types/
	utils/
	assets/
	App.tsx
	main.tsx
```

## Observações

- O ponto de entrada é [src/main.tsx](src/main.tsx).
- O estado global de usuário é fornecido por [src/context/UserContext.tsx](src/context/UserContext.tsx).
- O layout e os estilos globais ficam em [src/index.css](src/index.css).
