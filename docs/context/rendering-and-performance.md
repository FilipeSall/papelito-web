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

**O tipo de produto vem da categoria raiz do `product_cat`, por mapa explícito.** Os ids da UI (`sedas`, `piteiras`, `filtros`, `acessorios`) nunca foram slugs do WordPress — a raiz das sedas se chama `Papel` e a dos filtros `Filtro`. A tradução vive em `ROOT_CATEGORY_ALIASES`, em [`src/features/catalog/utils/product-type-taxonomy.ts`](../../src/features/catalog/utils/product-type-taxonomy.ts), e as subcategorias herdam o tipo da raiz via `parentDatabaseId`. **Não volte a classificar categoria por substring do nome** (`includes("seda")`, com `acessorios` de fallback): esse desenho fazia toda categoria desconhecida cair em ACESSÓRIOS e o filtro de Acessórios listar as sedas. Raiz fora do mapa fica **sem tipo** — o produto aparece só em TODOS, nunca em outra aba.

**O filtro de categoria é fail-closed.** Se a categoria pedida não resolve em nenhum termo — WPGraphQL indisponível, termo renomeado ou removido — a listagem devolve **zero produtos** com `console.warn`, nunca o catálogo inteiro. Em `fetchWpProducts`, `categoryIn` presente e vazio significa "nenhuma categoria corresponde": a cláusula não pode ser omitida da query. O filtro por tipo também roda sobre os itens já mapeados (`get-products-catalog.ts`), como segunda barreira — é uma exceção deliberada ao fail-open do catálogo, porque aqui o erro não é "faltou marcação regional", é "a aba mostra produto de outra categoria".

**Contagem das abas conta a raiz, não a árvore.** Produto fica atribuído à raiz *e* à subcategoria; somar todos os termos conta duas vezes (dava `todos: 62` para 40 produtos).

**Origem indisponível não é catálogo vazio.** `fetchWpProductsResult` devolve `ok: false` quando o WPGraphQL não responde, `getProductsCatalog` propaga `sourceStatus: "unavailable"` e `ProductsSection` renderiza `CatalogUnavailableNotice` em vez de "Nenhum produto encontrado.". Antes disso, `fetchWpProductsSafe` engolia a falha e devolvia `[]`: com o WordPress fora do ar o cliente lia que não existem produtos, sem erro nenhum no console do navegador (a falha é de SSR). Rota nova de listagem precisa repassar `sourceStatus` para a `ProductsSection` — foi assim que `/produtos` ficou de fora na primeira passada.

**O lote pedido ao WPGraphQL é constante, nunca derivado de `perPage`/`page`.** A chave do Data Cache do Next inclui o corpo da requisição, e o corpo carrega `first`: com o lote variável, cada combinação de `perPage` e página virava uma chave distinta. O efeito visível era duplo — durante uma indisponibilidade do WordPress só a combinação que já estava quente renderizava (o que fez o bug parecer específico de `colecao=promocoes`), e `totalItems` mudava de uma página para outra (`/produtos?perPage=9` dava `36` e 4 páginas na página 1, `38` e 5 páginas na página 2).

**`first` não passa de 100, e pedir mais é cortado em silêncio.** `AbstractConnectionResolver::max_query_amount()` do WPGraphQL devolve 100 e nada sobrescreve o filtro `graphql_connection_max_query_amount`. Por isso a listagem varre o catálogo com `fetchAllWpProductsResult`, paginando por cursor (`after`/`endCursor`) em blocos de `WP_GRAPHQL_MAX_FIRST`. **Não volte a confiar num `first` alto**: coleção, tipo e preço são filtrados em memória sobre o resultado, então um recorte silencioso produz contagem, filtro e coleção errados. `CATALOG_SCAN_LIMIT` é rede de segurança contra varredura infinita, não recorte — bater nele emite `console.warn`. Home e detalhe seguem pedindo uma página só, de propósito: querem amostra, não o catálogo.

**Coleção é termo de `product_cat`, nunca substring do nome.** `isPremium` e `isKit` saem dos slugs de `productCategories` (`premium`, `kits`). Classificar por nome — `name.includes("kit")` — mantinha `/kits` e `/premium` permanentemente vazios: nenhum dos 40 produtos tem "kit" ou "premium" no nome. É a mesma armadilha já documentada acima para categoria. **`/kits` depende de produtos atribuídos ao termo `kits` no WordPress**; o termo existe, a curadoria é da operação.

**Novidade é posição na ordenação por data, decidida fora do mapper.** `PRODUCTS_LIST_QUERY` ordena por `orderby: [{ field: DATE, order: DESC }]` e `markNewArrivals` marca os N primeiros. O `isNewArrival: index < 8` que vivia dentro de `mapWpProductToCatalogItem` era posição no lote — mudava com `perPage` e com a página.

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
