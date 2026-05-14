# Onboarding — papelito-web

Frontend Next.js do marketplace Papelito (WordPress headless).

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Apollo Client v4 (WPGraphQL) + SWR + Zustand
- Tailwind v4 + Embla Carousel
- NextAuth (Google + WP Credentials/JWT)

## Setup local
1. Backend rodando: `cd ../papelito-wordpress && docker-compose up -d`. Endpoint: `http://localhost:8080/graphql`.
2. `cp .env.example .env.local` e preencha:
   - `NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT=http://localhost:8080/graphql`
   - `NEXT_PUBLIC_WP_REST_BASE=http://localhost:8080/wp-json`
   - `NEXTAUTH_SECRET=$(openssl rand -base64 32)`
   - Google OAuth é opcional em dev.
3. Use Node 24 (`nvm use`) e instale dependencias com `bun install`.
4. Rode `bun run dev`. Abra `http://localhost:3000`.

## Comandos
- `bun run dev` — dev server.
- `bun run build && bun run start` — build de produção local.
- `bun run lint` — ESLint.
- `npx tsc --noEmit` — typecheck.
- `npm ci` — usado no CI; mantenha `package-lock.json` sincronizado ao alterar dependencias.

## Fluxo de feature
1. Branch `feature/<slug>`.
2. Implementar; sempre tipos estritos, sem `any`. Se mudar dependencias, atualize `bun.lock` e `package-lock.json`.
3. PR para `main` (passa por CI lint+typecheck+build).
4. Vercel cria Preview URL automaticamente; valide nele.
5. Merge → deploy automático em produção.
