# Codex Context — papelito-web

Leia `CLAUDE.md` antes de editar. Este repo é o frontend Next.js do marketplace Papelito.

## Performance: Home e Catálogo

Documento fonte: `docs/performance/home-produtos-loading-fix.md`.

- `app/(public)/page.tsx` deve continuar ISR/cacheável (`revalidate = 60`). Não adicione `getServerSession`, `cookies()`, `headers()` nem fetch `no-store` nessa rota.
- UI específica de seller na home deve ser tratada no cliente, hoje via `SellerHidden`.
- As rotas de catálogo (`/produtos`, `/colecoes`, `/kits`, `/novidades`, `/premium`, `/promocoes`) renderizam todos os produtos e não bloqueiam SSR em CEP/vendor/cobertura.
- Disponibilidade regional usa `ProductAvailabilityProvider` e `useProductAvailability`, chamando `GET /api/catalog/availability?productIds=...` apenas para usuário logado não-seller.
- Produtos sem cobertura/estoque no vendor da região ficam opacos, exibem tooltip e passam `disabledReason` para `AddToCartButton`.
- Anônimos e usuários sem CEP não chamam availability.
- Preserve `PRODUCTS_LIST_QUERY` como query leve de listagem; descrição completa, galeria e SKU pertencem à query de detalhe.

## Validação

```bash
npm run lint
npm run build
```

O resumo do build deve manter `/` como rota estática/ISR.
