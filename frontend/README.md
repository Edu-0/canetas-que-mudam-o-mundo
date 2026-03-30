# Frontend - Canetas que Mudam o Mundo

Interface React com Vite para o projeto.

## Setup

1. Instale as dependências:
```bash
npm install
```

2. Crie um arquivo `.env.local` (copie de `.env.example`):
```bash
VITE_API_URL=http://localhost:8000/api
```

## Desenvolvimento

```bash
npm run dev
```

A aplicação roda em `http://localhost:5173` e proxia requisições para `/api` para `http://localhost:8000`.

## Build

```bash
npm run build
```

Gera arquivos otimizados em `dist/`.

## Lint

```bash
npm run lint
```

## Estrutura

```
src/
├── components/    # Componentes reutilizáveis
├── pages/         # Páginas/telas
├── services/      # Chamadas de API
├── hooks/         # Hooks customizados
├── context/       # Estado global (Context API)
├── utils/         # Funções auxiliares
├── assets/        # Imagens, ícones
├── App.jsx        # Componente principal
└── main.jsx       # Ponto de entrada
```
