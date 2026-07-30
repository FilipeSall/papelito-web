# Papelito — Frontend Next.js

[![CI](https://github.com/FilipeSall/papelito-web/actions/workflows/ci.yml/badge.svg)](https://github.com/FilipeSall/papelito-web/actions/workflows/ci.yml)

Frontend headless do marketplace Papelito. Consome [`papelito-wordpress`](https://github.com/FilipeSall/papelito-wordpress) via WPGraphQL.

Em produção, configure `NEXTAUTH_URL=https://marketplace.papelito.com`.
Mantenha `papelito-web.vercel.app` acessível como fallback, mas não o use como
`NEXTAUTH_URL`. As sessões de login não são compartilhadas entre os dois domínios.

## Documentos
- [Onboarding](docs/onboarding.md)
