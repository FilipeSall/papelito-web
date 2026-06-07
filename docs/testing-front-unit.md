# Testes Unitários do Front

## Comandos

```bash
bun run test
bun run test:watch
bun run test:coverage
npm run test:ci
```

## Stack

- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `msw`

## Convenções

- Infra compartilhada em `test/`
- Testes co-localizados em `src/**`
- Mockar fronteiras de rede, sessão e browser
- Evitar snapshots como asserção principal
