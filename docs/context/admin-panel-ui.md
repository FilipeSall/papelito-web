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
- `/admin/reports` — absorvida por `/admin/sales`; a rota redireciona para `/admin/sales#exportar-vendas`
- `/vendor/financeiro` — absorvida por `/vendor/dashboard`; a rota redireciona

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

## Vendas e exportações — vale para os dois painéis

`/admin/sales` e `/vendor/dashboard` compartilham componentes e as mesmas regras de leitura. O que
muda entre eles é o escopo dos dados, que é resolvido no backend, nunca no cliente.

**Contrato de URL.** Além de `preset`/`from`/`to`/`page`, a página aceita `segment` (`all`,
`discounted`, `refunded`). `buildAdminSalesFilterQuery` preserva período **e** segmento em toda
troca de página; trocar de segmento volta para a página 1. O segmento padrão é omitido da
querystring. `VendorPeriodFilters` usa o mesmo construtor, então o segmento sobrevive à troca de
período no painel do vendor também.

**Composição.** Receita bruta e Mais vendidos dividem uma linha em `lg:grid-cols-2`, ocupando a
largura do pai. Pedidos paginam de 10 em 10, com o recorte vindo da origem — WooCommerce
(`page`/`per_page` + `X-WP-TotalPages`) no admin, `/vendor/me/orders` no vendor. Nada de buscar
tudo para paginar no cliente.

**Variação de receita.** É período contra período: a janela imediatamente anterior, de mesma
duração e mesmo segmento, calculada no WordPress. Quando não há base de comparação a interface diz
isso por extenso — não exibe `n/a` nem inventa um número.

**Sincronia dos filtros de exportação — mão única.** Cada área de exportação tem intervalo próprio,
governado por `useSyncedDateRange`:

- a página inicializa o intervalo local;
- mudar o intervalo local **não** altera o filtro da página;
- uma mudança posterior na página sobrescreve o override local;
- F5, nova entrada ou remontagem voltam ao filtro da página. **O override não é persistido.**

O estado nasce das props e é reajustado quando elas mudam, sem `useEffect` — é o que faz a regra do
F5 valer por construção, e não por limpeza manual.

**Semântica que não deve ser uniformizada.** O intervalo do export de usuários recorta **data de
cadastro**, não período de venda, e a interface rotula assim de propósito. Igualar o texto ao do
export de vendas modelaria o dado errado.

**Identidade de status.** `StatusBadge` (`admin-panel/primitives`) é a única identidade de status
dos painéis: borda preta de 2px, caixa alta pesada, amarelo no positivo, `#c0392b` no crítico, e o
tom `strong` para o chip escuro de cabeçalho. `operational-panel` é só um barrel dele, então o
painel do vendor herda a mesma gramática. Não crie uma segunda identidade por tabela, e **não
sobreponha cor por `className`** — o tom perde para a classe do componente em metade das
propriedades e produz pares proibidos, como amarelo sobre fundo claro.

**Navegação de seções.** `SalesSectionNav` é flutuante, discreta, aparece a partir de `xl` e tem
botão de recolher com a preferência lembrada. O conteúdo dos dois painéis rola **dentro de um
`div.overflow-y-auto`**, não na janela: a seção ativa é resolvida contra esse contêiner e o clique
marca na hora. Medir contra o viewport, ou usar offset fixo, é o que faz o item clicado não ficar
ativo — a mesma armadilha já registrada nas telas de configuração.

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
- **Slug editável só enquanto não há produto vinculado** — vale para categoria e para subcategoria. O
  WordPress recusa a troca com `papelito_category_slug_locked` / `papelito_subcategory_slug_locked`, e a
  recusa derruba o `PUT` inteiro: sem a trava no formulário, quem só queria renomear perde também o nome.
- **Falha de save aparece dentro do modal.** O aviso da página fica embaixo do overlay `fixed inset-0` e
  fora da viewport quando a lista está rolada — mensagem de erro só ali equivale a falhar em silêncio.
- **Sem lista de categorias hardcoded no frontend.** Falha ao carregar vira aviso na tela. Foi o silêncio
  do antigo `OFFICIAL_CATEGORY_KEYS` que escondeu a categoria `Kits` do admin por meses.

Salvar um produto continua em **duas requisições**: os campos comerciais vão para a REST do WooCommerce e
a classificação para `papelito/v1/admin/products/{id}/taxonomy`. Salvar sem categoria é bloqueado antes da
primeira. Se a classificação de uma criação falhar, produto publicado é compensado para rascunho; em edição,
a classificação anterior é preservada. O editor não envia categorias WooCommerce e não existe dual-write.

## Aba Cupons

`/admin/coupons` edita cupons com restrição opcional por vendor e por produto. Decisões que não são
óbvias pelo código:

- **As duas listas de restrição carregam sozinhas.** Vendors vêm de `/api/admin/coupons/vendor-options`
  e produtos de `/api/admin/coupons/product-options`, ambos no mount — o campo de texto só filtra. Um
  seletor que só existe depois de alguém digitar parece um seletor vazio, e foi assim que o de produtos
  foi reportado como quebrado.
- **`product-options` é uma rota enxuta de propósito.** Ela pede `id,name,sku` à REST do WooCommerce e
  nada mais. `/api/admin/products` traz tags e taxonomia junto, três idas ao WordPress por consulta —
  caro demais para um campo que dispara a cada pausa de digitação. Com `?ids=` ela também resolve o
  rótulo dos produtos já vinculados ao cupom em uma chamada, em vez de uma por produto.
- **Restrição por vendor não filtra a busca de produto.** São restrições independentes do cupom: o
  seletor lista o catálogo inteiro mesmo com vendors marcados.
- **Erro de API aparece na própria caixa**, com o status HTTP quando a resposta não é o JSON da rota
  (502/504 de gateway, função que estourou tempo). Sem isso, qualquer falha vira "Nenhum produto
  encontrado." e fica indistinguível de zero resultados.

## Benefícios do produto ficam em Assets, não em rota própria

A faixa de benefícios da página de produto é editada num painel recolhível dentro de `/admin/assets`
(`sections/assets/product-benefits/`). **Não existe `/admin/beneficios`**: apesar de a tela ser um CRUD
com modal e picker, o que ela edita é conteúdo editorial do site, igual aos banners, à faixa de avisos e
aos benefícios da Home — todos já morando em Assets. Uma entrada de menu para isso seria cosmética e
fragmentaria o mesmo domínio em dois lugares.

Decisões de interface que não são óbvias pelo código:

- **A prévia reusa o componente real** (`ProductBenefitsBar`), em vez de imitar o layout com marcação
  própria. A prévia dos benefícios da Home desenha à mão a faixa horizontal abaixo do header, que é um
  layout diferente: a faixa do produto é centralizada, com o ícone acima do título. Reusando o componente,
  ícone, título, texto e número de colunas não têm como divergir do que o cliente vê. A prévia da Home
  ficou intocada.
- **A configuração global aparece primeiro, com selo `global`, sem botão de excluir.** Ela é o padrão de
  todo produto sem configuração mais específica, e o backend recusa excluí-la ou desativá-la.
- **Ordenação por setas ↑↓**, como no restante do painel — o projeto não usa drag-and-drop em lugar nenhum.
- **Ícone é emoji ou SVG**, nunca um campo de HTML. O emoji tem paleta de atalho mas o campo é livre; a
  barreira real é o WordPress, que recusa alfanumérico ASCII e caracteres de markup.
- **A busca de produto reusa `/api/admin/flash-sale/products`.** Apesar do nome, é uma busca paginada
  genérica de produtos; criar um segundo endpoint idêntico só para trocar o rótulo seria duplicação.
- **Alvo já usado por outro grupo devolve erro com o nome do grupo atual**, porque a PK do banco impede
  dois donos para o mesmo produto, coleção ou categoria.

## Pendências

- Os botões de troca de papel de usuário ainda usam `window.confirm`, por decisão de escopo — não foram migrados para `BaseModal`.
- A UI de filtros de estoque por categoria/tag existe no painel do vendor mas não no admin, embora o backend tenha paridade.
- Não existe seção de suporte escalado (`/admin/suporte`).
