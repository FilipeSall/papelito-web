# Codex Context — papelito-web

**As instruções deste repositório vivem em [CLAUDE.md](CLAUDE.md)** — stack, invariantes e convenções. Leia-o primeiro; este arquivo não duplica o conteúdo.

Documentação:

- [docs/README.md](docs/README.md) — índice do frontend.
- [`../docs/README.md`](../docs/README.md) — contexto compartilhado com o backend: negócio, contratos REST/GraphQL e fluxos ponta a ponta.

O backend fica no repositório irmão `../papelito-wordpress`. Mudança que cruza os dois exige PR nos dois, na mesma branch nominal.

## Validação esperada

```bash
bun run lint
./node_modules/.bin/tsc --noEmit
bun run test:run
bun run build
npm ci        # o CI usa Node 24 + npm ci; package-lock.json precisa estar sincronizado
```

Mudança no fluxo de disponibilidade regional: conferir as invariantes em [docs/context/rendering-and-performance.md](docs/context/rendering-and-performance.md) e confirmar no resumo do build que `/` continua estática/ISR.
