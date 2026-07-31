# Testes do frontend

## Comandos

```bash
bun run test           # watch por padrão
bun run test:watch
bun run test:run       # execução única
bun run test:coverage
bun run test:ci        # o que o CI roda (run + coverage)
```

Todos os scripts delegam para `scripts/vitest-runner.sh`, que existe por um motivo: **usa `bunx --bun vitest` quando o Bun está disponível e cai para `node ./node_modules/vitest/vitest.mjs` quando não está**. É isso que faz o mesmo comando funcionar no ambiente local (Bun) e no CI (Node 24 + `npm ci`).

## Stack

`vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw`. Configuração em `vitest.config.ts` e `vitest.setup.ts`, na raiz do repositório.

## Por que Vitest e não `bun test`

Decisão registrada: **o CI roda Node + `npm ci`, não Bun.** Usar `bun test` faria a suíte local divergir da suíte do pipeline — o oposto do que um teste serve. Vitest roda igual nos dois, e o `vitest-runner.sh` cuida de qual runtime o invoca.

## Organização

```
test/                       infra compartilhada
  factories/                cart, notification, product, session, vendor
  msw/
    server.ts
    handlers/               auth, availability, cart, cep, checkout, coupons, notifications
  utils/
    render-with-providers.tsx
    reset-stores.ts
    server-only-stub.ts
src/**/*.test.ts(x)         testes co-localizados com o código
```

`server-only-stub.ts` existe porque `import "server-only"` quebra em jsdom — módulos server-only que precisam ser exercitados em teste passam por esse stub.

## Convenções

- **Infra compartilhada em `test/`; testes co-localizados em `src/**`.** Não crie um diretório espelho de testes.
- **Mocke somente a fronteira**: rede (via MSW), sessão, relógio e APIs de browser. **A lógica de domínio nunca é mockada** — se você está mockando a função que quer testar, o teste não vale nada.
- **Evite snapshot como asserção principal.** Snapshot documenta, não valida comportamento.
- Resete stores entre testes com `reset-stores.ts`; rate limits e caches são baseados em `localStorage`/transient e vazam entre casos.
- Handlers MSW ficam em `test/msw/handlers/<assunto>.ts`, um por superfície do backend. Ao criar um contrato novo com o WordPress, o handler correspondente é parte da entrega — é ele que mantém o contrato alinhado.

## O que a suíte cobre hoje

As regras de negócio verificadas por teste estão catalogadas em [`../../../docs/business-rules.md`](../../../docs/business-rules.md) — carrinho e totais, validadores brasileiros, renovação de JWT, guardas de rota, disponibilidade regional, notificações, checkout. Os testes de rota interna cobrem `api/cart/stock`, `api/catalog/availability` e `api/checkout/place-order`; os de componente cobrem o carrinho, a revisão do checkout e as ações do painel do vendor.

## Ao adicionar um teste

1. O comportamento é regra de negócio? Documente-o em `docs/business-rules.md` no lado compartilhado, além de testar.
2. Ele fala com o WordPress? Adicione o handler MSW em `test/msw/handlers/` em vez de mockar o `fetch`.
3. Ele depende de sessão? Use a factory `test/factories/session.ts`.
4. Ele depende de store? Garanta o reset — senão o teste passa isolado e falha na suíte.

## Verificação completa antes de um PR

```bash
bun run lint
./node_modules/.bin/tsc --noEmit
bun run test:run
bun run build
npm ci        # valida que package-lock.json está sincronizado
```
