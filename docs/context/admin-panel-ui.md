# Painel administrativo — arquitetura da informação

Decisões de navegação e URL do painel `/admin`. As regras de autorização e os contratos das operações estão em [`../../../docs/flows/admin.md`](../../../docs/flows/admin.md).

## Comercial: cupons, frete grátis e coleções

`/admin/coupons` tratava só de cupons e empilhava, sem hierarquia, três blocos que não conversavam:
frete grátis automático, parcelamento do checkout e a tabela de cupons. Desde 04/09 a rota é
**`/admin/comercial`**, rotulada `Comercial` no menu, e `/admin/coupons` redireciona.

- Quatro segmentos por `?tab=`: **Cupons** (padrão), **Frete grátis** e **Coleções** — as três
  mecânicas comerciais, com o mesmo peso — e, depois de um separador, **Parcelamento**, que é
  configuração de pagamento e não uma quarta mecânica. Mesma gramática do separador de Análises.
- **Só os dados do segmento ativo são buscados.** São quatro configurações independentes; carregar
  as quatro a cada visita pagaria três requisições que ninguém leu.
- **Os segmentos vêm acima do cabeçalho**, e não abaixo como em Contas. Aqui cada segmento tem
  assunto e ação primária próprios (`Novo cupom`, `Salvar regra`, `Salvar coleções`), então o
  cabeçalho pertence ao segmento escolhido. Escolher antes de agir continua valendo, e mais forte.
- **Nenhuma contagem nos segmentos.** O total de cupons vive no cabeçalho da moldura de resultados
  e o número de regiões na sentença da regra de frete. Repetir o número nas abas recriaria o defeito
  do "mesmo número em dois lugares" que a unificação de Contas corrigiu.
- Contrato de URL da aba Cupons: `status` (`publish`, `draft`), `search` e `page`; padrões omitidos.
  Busca, filtro e paginação existiam no backend desde sempre e estavam desligados no cliente.
- A **regra de frete grátis é lida como uma frase**, não como dois campos vizinhos: *"Frete grátis a
  partir de R$ 99,00 · 2 regiões"* fica no topo do segmento e um único botão salva mínimo e faixas.
  Sem faixa cadastrada a frase diz `todo o Brasil`, que é o padrão.
- **A máscara de CEP é só de interface.** O estado guarda o texto mascarado, o backend recebe oito
  dígitos, e nenhum `min`/`max` nativo entra nos campos numéricos: a validação nativa bloquearia o
  submit e mostraria a bolha do navegador em vez da mensagem no padrão da marca.

## Contas: pessoas, empresas e vendors são um domínio só

Usuários, vendors e empresas tinham listagens separadas — `/admin/users`, `/admin/vendors` e
`/admin/empresas` — e o administrador precisava saltar entre três telas para responder uma pergunta
só: *quem é essa pessoa, que empresa ela representa e o que ela pode fazer?* A decisão, com o motivo:

> Quem administra contas navega por relacionamento, não por tabela. Pessoa → empresa → vendor →
> membros da empresa → solicitações precisa ser um percurso, não três sistemas.

O que passa a valer:

- **`/admin/contas` é a única entrada de navegação** para pessoas, empresas e análises.
- Quatro segmentos controlados por `?tab=`: **Contas** (padrão), **Empresas** e **Vendors** — as três
  entidades, com o mesmo peso visual — e, depois de um separador, **Análises**, que é fila de
  trabalho e não uma quarta entidade.
- **Vendors é segmento, não filtro de perfil.** Vem da mesma fonte das contas (`role=seller`), sem
  endpoint novo, porque vendor no domínio é uma conta com role `seller`.
- **Busca, filtros e paginação vivem na URL**, nunca em estado local — a tela é compartilhável.
- **Só os dados da aba ativa são buscados.**
- Detalhes: `/admin/contas/[id]` para a pessoa e `/admin/contas/empresa/[id]` para a empresa. O
  painel operacional do vendor continua em `/admin/vendors/[id]`, alcançável pelo detalhe da pessoa
  — é ferramenta de operação (estoque, cobertura, financeiro), não de gestão de conta.
- O detalhe da pessoa ganhou a aba **Conta**, que reúne situação comercial, ação de suspender ou
  reativar, histórico e as empresas vinculadas.

### Contrato de URL da aba Pessoas

`role`, `status` (`active`, `suspended`, `email_pending`), `relation` (`company`, `unlinked`),
`search` e `page`. Os valores padrão são omitidos da URL. `?create=1&sourceUserId=` e
`&sourceInterestId=` abrem a criação de vendor sobre a listagem, como fazia `/admin/vendors`.

### Contrato de URL da aba Análises

`analysisType` (`company`, `vendor`) e `analysisStatus`. A fila junta, numa lista só, candidaturas de
empresa com conta existente, candidaturas pré-conta e manifestações de interesse em ser vendor —
cada linha diz o tipo, quem pediu, a empresa, quando chegou e a situação. A decisão continua nas
telas de origem: `?preAccountApplication=pre:{id}` na própria aba, `/admin/contas/{id}?tab=company-review`
para candidatura com conta, e `/admin/vendors/interesses/{id}` para interesse de vendor.

### Composição visual

A primeira versão da tela empilhava cabeçalho da seção, caixa de "recorte atual", painel de filtros
e cinco cards de métrica antes do primeiro resultado. Três defeitos concretos saíram dali:

1. **O mesmo número aparecia duas vezes** — "recorte atual" e "total filtrado" eram a mesma coisa.
2. **As abas ficavam abaixo dos filtros**, ou seja, filtrava-se antes de escolher o que filtrar.
3. **Os métricos empurravam a listagem para fora da primeira dobra** numa tela cujo trabalho é achar
   uma pessoa.

A composição atual segue a Taxonomia e tem uma ordem só:

```
CABEÇALHO (losango + título + uma linha de contexto + ação primária)
SEGMENTOS  [Contas] [Empresas] [Vendors] ‖ [Análises]
ALERTA     (só quando existe conta suspensa)
FILTROS    (busca + selects, mesma altura, alinhados)
RESULTADOS (moldura única com faixa amarela; uma linha por registro)
```

- **Nenhum card de métrica.** A contagem de cada entidade vive no próprio segmento, e o total do
  recorte no cabeçalho da moldura de resultados. Números com significados diferentes deixaram de
  compartilhar o mesmo nome.
- **Uma moldura, não N cards.** `border-2` + `shadow-[8px_8px_0px_#1a1a1a]` + faixa amarela envolvem
  a lista inteira; as linhas se separam por `divide-y-2` interno. Evita a soma de sombras que fazia a
  página vibrar.
- **`ResultRow` tem sempre a mesma gramática** nos quatro segmentos: identidade à esquerda,
  relacionamento no meio (precedido por uma seta), estado e ação à direita. É o que torna a relação
  Conta → Empresa → Vendor legível sem legenda.
- A linha inteira é clicável por um link em `absolute inset-0`; links internos (empresa, titular,
  operação) sobem com `relative z-10`.

### Alinhamento dos filtros

`AdminSelectField` (variante `vendor-create`) renderiza `label` com altura fixa `h-4` e `gap-2` até
o controle `h-11`. O campo de busca **precisa repetir essa estrutura** — foi por não repetir, e por
carregar um losango no label, que o input ficava alguns pixels acima dos selects. `AccountsFilterBar`
mantém os dois lados idênticos; qualquer campo novo na barra copia esse label.

### Status: ícone + texto, nunca só cor

`status-chip.tsx` concentra o vocabulário. Cada estado real do domínio mapeia para um ícone do
**lucide-react** (a biblioteca que o painel já usa), sempre com `strokeWidth` 2.4, `h-3.5 w-3.5` e
`aria-hidden` — o significado fica no texto ao lado, que nunca é omitido.

| Estado | Ícone |
|---|---|
| Ativa (conta ou empresa) | `CircleCheck` |
| Suspensa | `Ban` |
| E-mail pendente | `MailWarning` |
| Em análise / aguardando revisão | `Clock` |
| Aguardando documento | `CircleAlert` |
| Reprovada | `CircleX` |
| Arquivada | `CircleDashed` |
| Pessoa / Empresa / Vendor (entidade) | `User` / `Building2` / `Store` |

Regra que não pode regredir: **nenhum estado é comunicado só por cor**. Em preto e branco, sem
legenda, ou para quem não distingue as cores da marca, o rótulo continua dizendo tudo. `EntityMark`
usa `sr-only` para dar nome ao ícone quando ele aparece sozinho.

Em telas estreitas a navegação de segmentos quebra em várias linhas **sem truncar rótulos** —
truncar rótulo administrativo é perda de informação, não economia de espaço — e cada `ResultRow`
passa de linha para bloco empilhado, sem scroll horizontal.

Na listagem de contas, o campo do meio é contextual: mostra a empresa e o papel quando existe
vínculo, a loja e a cobertura quando a conta é vendor, e "sem vínculo empresarial" caso contrário.
Um campo só, porque as duas informações nunca coexistem no domínio.

### Suspensão de conta na interface

- A ação vive na aba **Conta** do detalhe, e no detalhe da empresa para suspender a empresa inteira.
- **Suspender abre modal com justificativa obrigatória** (5 a 500 caracteres); reativar aceita
  justificativa opcional. O histórico aparece logo abaixo, com autor e data.
- O botão de confirmação do modal diz **Confirmar suspensão** / **Confirmar reativação**, e não
  repete o rótulo do botão que abriu o modal — dois botões com o mesmo nome acessível na mesma tela
  são ambíguos para leitor de tela.
- Quando a suspensão é recusada pelo backend (único titular ativo, administrador, própria conta), a
  interface **não mostra o botão** e exibe o motivo no lugar. O backend recusa de qualquer forma.
- Conta suspensa vê um aviso persistente na área autenticada (`AccountSuspensionNotice`), e o painel
  do vendor troca **Estoque** e **Cobertura** por um bloqueio explicativo. **Pedidos, rastreio e
  mensagens continuam abertos** — quem já comprou precisa receber.
- O aviso lê `session.b2b.accountStatus`, que viaja no refresh de identidade do NextAuth **a cada
  5 minutos**. Ou seja: uma suspensão aplicada agora aparece na tela da pessoa em até 5 minutos. Não
  é uma brecha — o WordPress recusa compra e venda no mesmo instante; o atraso é só do aviso.

## Rotas removidas

Registro de migração — links antigos apontam para lugar nenhum:

- `/admin/vendor-interests`
- `/admin/vendor-interests/[id]`
- `/admin/reports` — absorvida por `/admin/sales`; a rota redireciona para `/admin/sales#exportar-vendas`
- `/vendor/financeiro` — absorvida por `/vendor/dashboard`; a rota redireciona
- `/admin/users` e `/admin/users/[id]` — absorvidas por `/admin/contas`; redirecionam preservando a query
- `/admin/vendors` (listagem) — absorvida por `/admin/contas?role=seller`; `?tab=interesses` cai na aba Análises. O **detalhe** `/admin/vendors/[id]` continua existindo
- `/admin/empresas` (listagem) — absorvida por `/admin/contas?tab=analises`

Todos os pontos de entrada foram repontados para as rotas sob `/admin/vendors`: links de notificação, listagem, paginação e retorno do detalhe. O link de notificação vive em `src/features/notifications/utils/format-notification.ts` — **é o único lugar que conhece os deep links administrativos**, então qualquer nova mudança de rota no painel precisa passar por lá.

## Onde ficam os componentes

- `src/components/layout/admin-panel/` — casca do painel.
- `src/components/layout/admin-panel/admin-config.ts` — itens de navegação. Adicionar seção começa aqui.
- `src/components/layout/admin-panel/sections/<assunto>/` — conteúdo por seção; `sections/accounts/accounts-tabs.tsx` é a referência de abas controladas por URL, e `sections/accounts/accounts-config.ts` concentra rótulos, rotas e formatadores compartilhados da área de contas.
- `app/admin/` — rotas; `app/api/admin/*` — proxies que mantêm o JWT no servidor.

## Candidaturas empresariais pré-conta

Uma candidatura documental ainda não é um usuário: não existe `wp_user`, sessão, empresa nem membership antes da decisão. Mesmo assim, ela aparece em `/admin/contas` como registro **Candidatura pré-conta** com status **Sob análise**. A ação **Analisar** e a notificação usam `?preAccountApplication=pre:{id}` para abrir, na própria tela, o documento privado e as ações Aprovar/Reprovar. A tabela preserva busca e paginação junto das contas existentes, sem transformar a candidatura em conta.

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

**Navegação de seções.** `SalesSectionNav` é flutuante, discreta e aparece a partir de `xl`. O
conteúdo dos dois painéis rola **dentro de um `div.overflow-y-auto`**, não na janela: a seção ativa
é resolvida contra esse contêiner e o clique marca na hora. Medir contra o viewport, ou usar offset
fixo, é o que faz o item clicado não ficar ativo — a mesma armadilha já registrada nas telas de
configuração.

**Ocultar e arrastar são estado de visita, não preferência.** Não há recolher: o botão é **Ocultar**,
e ocultar remove a navegação da tela sem nenhum caminho de volta na interface — só recarregar traz.

- O flag de oculto fica em `sessionStorage`, para atravessar navegação e o submit `method="get"` do
  filtro, e é **apagado no boot do módulo** (uma vez por carregamento de página). `sessionStorage`
  sobrevive ao F5 por conta própria, e sem essa limpeza o usuário ficaria preso sem a navegação
  pelo resto da aba. Nunca troque por `localStorage`.
- A posição arrastada fica num store de módulo carimbado com o `pathname`: sobrevive ao remonte que
  a troca de filtro provoca (filtro é query, a rota não muda) e é descartada ao trocar de seção ou
  recarregar. Nada de posição é persistido.
- O arrasto sai **só do punho de seis pontos** acima de "Ocultar". Arrastar pelo corpo exigiria
  engolir cliques por limiar de movimento, e era isso que roubava o clique de Resumo/Gráfico/Exportações.
- Ao arrastar, a navegação troca a âncora `right-6 top-1/2 -translate-y-1/2` por `left`/`top`
  absolutos. Manter a centralização faria o painel pular quando a altura da caixa mudasse.
- A posição é sempre limitada à viewport, e reancorada em `resize` e em mudança de tamanho do
  próprio painel (`ResizeObserver`) — arrastar para a borda não pode deixá-la fora da tela.

**Filtro de período é um só componente.** `SalesPeriodFilter` (presets + `de`/`até` + Aplicar) serve
o admin, dentro do `SalesWindowBar`, e o painel do vendor, dentro de `VendorPeriodFilters`. O vendor
tinha um cartão macio próprio (`rounded-[14px]`, `border-brand-dark/15`) que era a única sobra do
estilo antigo no painel — não recrie variante local do filtro, passe `basePath` e, se precisar,
`className` para o encaixe.

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

## Assets: a página do site é o eixo, não o tipo de arquivo

`/admin/assets` empilhava cinco painéis recolhíveis cuja única pista de a que página pública o asset
pertencia era a palavra do `eyebrow` — `home`, `global` e, o revelador, `produtos / sobre / revendedor`:
três páginas espremidas num painel só chamado "Imagens das paginas", atrás de um botão Salvar. Como
painel e card tinham chevron próprio, chegar a **uma** imagem custava até três cliques e a primeira
dobra não mostrava asset nenhum. A decisão, com o motivo:

> Quem edita assets pensa por página do site — "preciso trocar a foto da Sobre" —, não por tipo de
> arquivo. A página é o eixo de navegação; o tipo é detalhe do editor.

O que passa a valer:

- **Cinco segmentos por página pública**, na mesma gramática de Contas e Produtos: **Global**, **Home**,
  **Produtos**, **Sobre** e **Revendedor**. O registro vive em `sections/assets/assets-config.ts` —
  página nova entra ali e em nenhum outro lugar da navegação.
- **Cada asset é uma linha em `ResultFrame`**, com miniatura, onde ele aparece no site, `StatusChip` e
  `Editar`; clicar abre um modal (`asset-editor-modal.tsx`, no desenho de `vendor-create-content.tsx`).
  Não há mais accordion dentro de accordion.
- **Um `ResultFrame` por grupo de salvamento**, e os grupos são exatamente os seis `PUT` que já existiam
  — hero, faixa, benefícios, PDV Perfeito, imagens de página e logos. O Salvar do modal dispara o mesmo
  `PUT` do bloco: nenhum contrato de backend mudou.
- **O catálogo PDF mudou de lugar.** Estava dentro do bloco PDV Perfeito, na Home; o link `/api/catalog`
  só existe em `/revendedor`, então é lá que ele aparece.

### Contrato de URL

`?pagina=` com `global`, `home`, `produtos`, `sobre` ou `revendedor`; `home` é o padrão e é omitido.

**Diferente de Contas e Comercial, a troca de página não navega.** Ela é estado de cliente espelhado na
URL com `window.history.replaceState` (`use-assets-page.ts`), e essa é a única divergência deliberada do
contrato `?tab=`. O motivo é que Assets é um **editor**, não uma listagem: navegação do Next remontaria
o gerenciador e descartaria edição ainda não salva ao trocar de página. `pushState` também está fora —
o router não escuta esse `popstate`, então o Voltar mudaria a URL sem mudar a tela.

Pela mesma razão, **os seis snapshots continuam sendo buscados de uma vez** no servidor, e não só os da
página ativa: eles alimentam o contador de todos os segmentos e precisam sobreviver à troca de página.

### Estado do asset: ícone mais texto, como no resto do painel

`assets-status.ts` concentra o vocabulário, mapeando cada estado real para um ícone do **lucide-react**:

| Estado | Chip | Tom |
|---|---|---|
| Imagem e alt preenchidos | `Configurado` | positivo |
| Ainda no arquivo padrão do projeto | `Padrão do projeto` | neutro |
| Sem texto alternativo | `Sem texto alternativo` | pendente |
| Sem imagem | `Imagem ausente` | crítico |
| Editado e ainda não publicado | `Não salvo` | pendente |

`crítico` fica reservado a "ausente" porque esse estado **bloqueia o salvamento de verdade**: o validador
do plugin devolve 422 com `Imagem {key} precisa ter arquivo e alt preenchidos.` Não é ênfase decorativa.

**`Padrão do projeto` vale para logo e para imagem de página.** Os defaults ficam em `src/lib/site-logos.ts`
e `src/lib/site-images.ts`, os dois client-safe, porque a listagem precisa deles no navegador. Sem essa
distinção o chip mentia: toda imagem de página nasce apontando para um arquivo em `public/`, então
todas liam como `Configurado` sem ninguém ter subido nada.

### Armadilhas registradas

- **O card amarelo de `/revendedor` deixou de ser asset.** Ele era `revendedorBusinessIllustration`,
  mas o desenho padrão são três SVGs cravados no componente e o asset não editava esse desenho —
  substituía a composição inteira por uma imagem só. Como ninguém pretende trocá-lo, a chave saiu do
  tipo, dos defaults dos dois lados e do payload de `/site/image-assets`: a arte agora é puramente
  frontend, em `revendedor-business-types-section.tsx`. **Sobraram cinco imagens de página.**
- **As cinco imagens de página compartilham um `PUT`.** Salvar a partir de Sobre publica também o que
  estiver pendente em Produtos e Revendedor. O botão libera quando qualquer uma mudou — é o que a
  requisição faz — e o selo `Não salvo` diz quais mudaram.
- **Erro de salvamento aparece no bloco que falhou**, e dentro do modal quando veio de lá. O aviso único
  no topo da tela, que nunca sumia e era sobrescrito pela ação seguinte, saiu. Sucesso é `AdminToast`.
- **Upload não publica.** O arquivo sobe para a mídia temporária e a linha passa a `Não salvo`; só o
  Salvar do bloco publica.

## Benefícios do produto ficam em Assets, não em rota própria

A faixa de benefícios da página de produto é editada na aba **Assets de Produtos**
(`/admin/products?tab=assets`), a partir de `sections/assets/product-benefits/` — a pasta continua sob
`assets/` porque nasceu lá, mas quem a renderiza é `products-content.tsx`. **Não existe `/admin/beneficios`**: apesar de a tela ser um CRUD
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
