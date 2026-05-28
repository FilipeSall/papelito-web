# Correção de Loading da Home e Produtos

## Diagnóstico ranqueado

1. A home dependia de `getServerSession` e passava `accessToken` para flash sale, forçando `no-store` e SSR dinâmico.
2. A listagem de produtos bloqueava o HTML inicial em CEP, vendor ativo e `coverage/products`.
3. `coverage/products` calculava cobertura produto a produto, repetindo geocódigo, busca de vendors por CEP, estoque e usermeta.
4. A query GraphQL de listagem carregava campos de detalhe, como descrição, galeria e SKU.
5. O cache estava concentrado em `cache()` por request, com pouco cache persistente entre navegações e pouca separação entre catálogo público e dados regionais.

## Correções aplicadas

- A home voltou a ser pública/cacheável: sessão de seller é tratada em client component e não participa mais do SSR da rota.
- Produtos, coleções, kits, novidades, premium e promoções não fazem mais consulta server-side de CEP/vendor para renderizar a listagem.
- A disponibilidade regional agora roda no cliente apenas para usuário logado não-seller, via `GET /api/catalog/availability?productIds=...`.
- Produtos indisponíveis no vendor da região ficam opacos, mostram tooltip em hover/focus e têm o botão de compra desabilitado.
- A API interna cacheia disponibilidade por conta, CEP, vendor ativo e hash dos produtos por 5 minutos.
- O browser também usa cache em `localStorage` por 5 minutos, via SWR, para acelerar navegação repetida.
- A query GraphQL de listagem foi separada da query de detalhe para reduzir payload.
- O WordPress agora calcula `coverage/products` em lote, com transient versionado e invalidação por alteração de estoque ou metadados relevantes de vendor/CEP.
- Quando a consulta informa `vendor_id`, o WordPress checa apenas cobertura e estoque desse vendor ativo, sem bloquear em geocodificação externa.

## Critérios de aceite

- `npm run build` deve passar.
- `/` deve aparecer como rota estática/ISR no resumo do build, sem SSR dinâmico por sessão.
- Usuário anônimo não deve chamar `/api/catalog/availability`.
- Usuário logado com CEP deve receber catálogo/home rapidamente e aplicar disponibilidade depois da hidratação.
- Produto indisponível deve ficar opaco, exibir tooltip "O vendor da sua região não tem esse produto." e não permitir compra.
- `php -l` deve passar em `includes/rest_api.php` e `includes/vendor_stock.php`.

## Observações

- A validação definitiva de vendor/estoque continua no fluxo de carrinho/checkout.
- A disponibilidade visual é uma camada progressiva: se a API falhar, o catálogo permanece utilizável sem marcação regional.
- O cache WordPress usa versionamento em option para evitar limpeza wildcard de transients.
