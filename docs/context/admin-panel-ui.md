# Painel administrativo — arquitetura da informação

Decisões de navegação e URL do painel `/admin`. As regras de autorização e os contratos das operações estão em [`../../../docs/flows/admin.md`](../../../docs/flows/admin.md).

## Vendors e interesses são um único domínio

As manifestações de interesse em se tornar vendor tinham listagem e detalhe próprios em `/admin/vendor-interests`, como se fossem outro domínio. Não são. A decisão, com o motivo:

> A navegação deve representar um único domínio administrativo: vendors cadastrados e customers que manifestaram interesse.

O que passou a valer:

- `/admin/vendors` é a **única** entrada de navegação.
- A página tem duas abas: **Vendors cadastrados** e **Interesses em ser vendor**.
- A aba de interesses é controlada por `/admin/vendors?tab=interesses`.
- **Busca e paginação vivem na URL da aba ativa**, não em estado local — o estado da tela é compartilhável.
- O detalhe fica em `/admin/vendors/interesses/[id]`, preservando URL direta e compartilhável.
- **Só os dados da aba ativa são buscados.**
- Endpoints, contratos, persistência e autorização administrativos **não** mudaram.

### Interface

As abas reutilizam a paleta, as bordas, a tipografia em caixa alta e os estados de foco do painel. Em telas estreitas a navegação **rola horizontalmente sem truncar os rótulos** — truncar rótulo de aba administrativa é perda de informação, não economia de espaço.

A ação **Novo vendor** permanece na aba de vendors cadastrados. A aba de interesses é focada em busca, leitura e contato.

## Rotas removidas

Registro de migração — links antigos apontam para lugar nenhum:

- `/admin/vendor-interests`
- `/admin/vendor-interests/[id]`

Todos os pontos de entrada foram repontados para as rotas sob `/admin/vendors`: links de notificação, listagem, paginação e retorno do detalhe. O link de notificação vive em `src/features/notifications/utils/format-notification.ts` — **é o único lugar que conhece os deep links administrativos**, então qualquer nova mudança de rota no painel precisa passar por lá.

## Onde ficam os componentes

- `src/components/layout/admin-panel/` — casca do painel.
- `src/components/layout/admin-panel/admin-config.ts` — itens de navegação. Adicionar seção começa aqui.
- `src/components/layout/admin-panel/sections/<assunto>/` — conteúdo por seção; `sections/vendors/vendors-tabs.tsx` é a referência de abas controladas por URL.
- `app/admin/` — rotas; `app/api/admin/*` — proxies que mantêm o JWT no servidor.

## Candidaturas empresariais pré-conta

Uma candidatura documental ainda não é um usuário: não existe `wp_user`, sessão, empresa nem membership antes da decisão. Mesmo assim, ela aparece em `/admin/users` como registro **Candidatura pré-conta** com status **Sob análise**. A ação **Analisar** e a notificação usam `?preAccountApplication=pre:{id}` para abrir, na própria tela, o documento privado e as ações Aprovar/Reprovar. A tabela preserva busca e paginação junto das contas existentes, sem transformar a candidatura em conta.

## Convenções do painel

- O visual do admin é deliberadamente diferente do público: cantos retos, bordas grossas, sombras duras, fundo off-white. As regras e os valores exatos estão em [`../brand/identidade-visual.md`](../brand/identidade-visual.md).
- Modais usam `BaseModal` (casca sem header/footer). `vendor-cancel-shipment-modal.tsx` é o precedente de uso.
- Ação destrutiva usa a paleta de perigo `#b91c1c` / hover `#991b1b`.
- Ação administrativa que muda estado exige confirmação, e a que rejeita algo exige motivo — o motivo é o que chega ao usuário afetado.
- Estado fresco depois de uma ação vem do `router.refresh()`, não do corpo da resposta do POST — que é **deliberadamente descartado**. Para isso funcionar, o fetch de detalhe precisa continuar `no-store`.

## Aba Categorias

`/admin/categories` gerencia a taxonomia própria da Papelito — a entidade que substitui `product_cat` nas
regras de catálogo. Plano completo em [`../../../docs/prompts/product-taxonomy/`](../../../docs/prompts/product-taxonomy/README.md).

Decisões de interface que não são óbvias pelo código:

- **Categoria é `select`, subcategoria é checkbox.** O controle comunica a cardinalidade sem texto
  auxiliar: um produto tem exatamente uma categoria principal e quantas subcategorias fizerem sentido.
- **Subcategorias aparecem só depois da categoria escolhida**, agrupadas por **faceta** (material, formato,
  tamanho, tipo, linha). A faceta é o que faz o multivalor ter sentido — uma seda pode ser Brown e Slim ao
  mesmo tempo.
- **Trocar a categoria limpa as subcategorias.** Elas pertenciam à categoria anterior e o backend recusaria
  o conjunto com `papelito_subcategory_foreign`.
- **Subcategoria inativa some da lista, mas não do produto.** Se o produto já a tem, continua visível,
  marcada como `inativa` e desabilitada. A API preserva somente esse vínculo preexistente; associação nova é recusada.
- **Slug editável só enquanto a categoria não tem produto.**
- **Sem lista de categorias hardcoded no frontend.** Falha ao carregar vira aviso na tela. Foi o silêncio
  do antigo `OFFICIAL_CATEGORY_KEYS` que escondeu a categoria `Kits` do admin por meses.

Salvar um produto continua em **duas requisições**: os campos comerciais vão para a REST do WooCommerce e
a classificação para `papelito/v1/admin/products/{id}/taxonomy`. Salvar sem categoria é bloqueado antes da
primeira. Se a classificação de uma criação falhar, produto publicado é compensado para rascunho; em edição,
a classificação anterior é preservada. O editor não envia categorias WooCommerce e não existe dual-write.

## Pendências

- Os botões de troca de papel de usuário ainda usam `window.confirm`, por decisão de escopo — não foram migrados para `BaseModal`.
- A UI de filtros de estoque por categoria/tag existe no painel do vendor mas não no admin, embora o backend tenha paridade.
- Não existe seção de suporte escalado (`/admin/suporte`).
