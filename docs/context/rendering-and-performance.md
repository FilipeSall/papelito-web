# Renderização e performance

Este documento existe porque a home e o catálogo já foram lentos, o motivo foi diagnosticado, corrigido — e é fácil de regredir sem perceber. As invariantes abaixo são vinculantes.

## Causa-raiz original, em ordem de impacto

1. A home dependia de `getServerSession` e passava `accessToken` para a flash sale, o que forçava `no-store` e SSR dinâmico na rota inteira.
2. A listagem de produtos bloqueava o HTML inicial em CEP, vendor ativo e `coverage/products`.
3. `coverage/products` no WordPress calculava cobertura **produto a produto**, repetindo geocodificação, busca de vendors por CEP, leitura de estoque e de usermeta.
4. A query GraphQL de listagem carregava campos de detalhe — descrição, galeria, SKU.
5. O cache estava concentrado em `cache()` por request, com pouco cache persistente entre navegações e pouca separação entre catálogo público e dado regional.

## Invariantes

**Home pública é ISR/cacheável.** `app/(public)/page.tsx` tem `export const revalidate = 60`. Não reintroduza `getServerSession`, `cookies()`, `headers()` nem fetch `no-store` no SSR dessa rota. UI específica de seller é escondida no cliente com `SellerHidden` — nunca decidida no servidor.

**O catálogo público renderiza todos os produtos.** `/produtos`, `/colecoes`, `/kits`, `/novidades`, `/premium` e `/promocoes` não podem bloquear SSR em CEP, vendor ativo ou cobertura.

**Disponibilidade regional é uma camada progressiva no cliente.** Use `ProductAvailabilityProvider` + `useProductAvailability`; a API interna é `GET /api/catalog/availability?productIds=...`. Se ela falhar, o catálogo continua utilizável sem marcação regional — **fail-open deliberado**.

**Produto indisponível não desaparece.** Ele recebe opacidade reduzida, tooltip em hover e em focus, e o `AddToCartButton` recebe `disabledReason`. O texto é exatamente: `O vendor da sua região não tem esse produto.`

**A fonte da região é apenas o CEP salvo na conta do usuário logado.** Não existe prompt de CEP, cookie `papelito_user_cep` nem store de CEP — esse desenho foi implementado, testado e **removido**. Anônimo ou logado sem CEP não chama availability e vê o catálogo normal; a área logada mostra um aviso curto.

**Cache esperado**: server-side por `accountId + cep + activeVendorId + productIdsHash` por 5 minutos; cliente em `localStorage` + SWR por 5 minutos.

**A query de listagem é leve.** `PRODUCTS_LIST_QUERY` não deve voltar a carregar descrição completa, galeria e SKU — esses campos pertencem à query de detalhe.

## Onde a validação de verdade acontece

A marcação visual de disponibilidade **não é** controle de acesso. A validação definitiva de vendor e estoque acontece no fluxo de carrinho e checkout, e depois na reserva transacional no WordPress. Ver [`../../../docs/flows/cart-and-checkout.md`](../../../docs/flows/cart-and-checkout.md).

Por isso as duas camadas têm políticas opostas de erro, e isso é intencional:

| Camada | Em caso de erro |
|---|---|
| disponibilidade no catálogo | **fail-open** — mostra tudo, sem marcação |
| validação de estoque no carrinho/checkout | **fail-closed** — bloqueia a ação |

## Cache de dados que não é do catálogo

- `/api/catalog` (PDF) é `no-store` no navegador e na CDN, para a troca feita pelo admin aparecer na próxima abertura sem esperar TTL.
- `getAdminUserDetail` precisa continuar `wpRest` com `cache: "no-store"`; com cache, `router.refresh()` não re-busca e ações administrativas ficam visíveis depois de já executadas.
- A chamada do Next ao WordPress para revalidar estoque **não** tem cache no Next — o transient versionado do backend já resolve.
- Troca de vendor ativo chama `revalidateTag('wp:coverage', 'max')`.

## Como verificar que não regrediu

```bash
bun run build
```

No resumo do build, `/` deve aparecer como rota estática/ISR — **não** como SSR dinâmico por sessão. Além disso:

- usuário anônimo não deve chamar `/api/catalog/availability`;
- usuário logado com CEP deve receber home e catálogo rápido e ver a disponibilidade aplicada **depois** da hidratação;
- produto indisponível deve ficar opaco, com tooltip, e não permitir compra.

No lado do WordPress, `php -l` em `includes/rest_api.php` e `includes/vendor_stock.php`, e testar `coverage/products` com 1, 10 e 40 produtos — o custo tem de crescer sublinearmente.

## Contrato com o backend

`GET /wp-json/papelito/v1/coverage/products` devolve, por produto, `has_coverage`, `best_vendor` e `alternatives`; o front mapeia isso para `available: boolean`. Quando o front informa `vendor_id`, o backend checa **apenas** cobertura e estoque daquele vendor, **sem geocodificar**.

O cache do backend é um transient versionado por option (não limpeza wildcard de transients), invalidado por mudança de estoque ou de metadados relevantes de vendor/CEP. Detalhes em [`../../../docs/flows/catalog-and-availability.md`](../../../docs/flows/catalog-and-availability.md).
