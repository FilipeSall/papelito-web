# Papelito — Frontend Next.js

[![CI](https://github.com/FilipeSall/papelito-web/actions/workflows/ci.yml/badge.svg)](https://github.com/FilipeSall/papelito-web/actions/workflows/ci.yml)

Frontend headless do marketplace B2B Papelito. Consome [`papelito-wordpress`](https://github.com/FilipeSall/papelito-wordpress) via WPGraphQL (catálogo, cliente) e REST (`/wp-json/papelito/v1/*`, regras de negócio).

Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · NextAuth JWT-only · Apollo · Zustand · SWR · Vitest.

## Começar

```bash
# o backend precisa estar rodando
cd ../papelito-wordpress && docker compose up -d

cd papelito-web
cp .env.example .env.local
nvm use && bun install
bun run dev          # http://localhost:3000
```

## Documentação

- **[docs/README.md](docs/README.md)** — índice do frontend: arquitetura, performance, testes, design system.
- **[CLAUDE.md](CLAUDE.md)** — invariantes e convenções para quem (ou o que) vai editar o código.
- O contexto compartilhado com o backend — negócio, contratos e fluxos ponta a ponta — fica no workspace, em `../docs/`.

## Produção

Configure `NEXTAUTH_URL=https://marketplace.papelito.com`. Mantenha `papelito-web.vercel.app` acessível como fallback, mas **não** o use como `NEXTAUTH_URL`: as sessões de login não são compartilhadas entre os dois domínios.
