# Refatoração do editor administrativo de Kits

## Objetivo

Corrigir a criação de produtos órfãos quando a imagem obrigatória de um Kit é
rejeitada e decompor o editor administrativo de Kits sem alterar sua aparência
ou os contratos já consumidos pelo frontend.

## Fronteiras

- `kits-manager.tsx` será a composição da tela: lista, abertura e fechamento do
  editor, e estado que pertence à página.
- `kit-editor-controller.ts` concentrará o ciclo do draft, upload direto,
  descarte de mídia temporária e salvamento.
- `kit-editor-service.ts` serializará o draft e chamará as rotas internas do
  Next; a UI não fará `fetch` diretamente.
- `kit-editor-draft.ts` e `kit-editor-types.ts` conterão as fábricas,
  transformações e tipos compartilhados.
- Os elementos de apresentação serão separados em componentes de lista, editor,
  produtos e brindes. O modal continuará visualmente igual, mas usará o
  elemento HTML `dialog`: abertura com `showModal()`, fechamento com `close()`
  e sincronização de `onClose` (inclusive Escape) com o estado React. Durante
  `saving`, o editor continuará sem permitir fechamento.

## Critérios de qualidade

- A fábrica de brinde receberá `undefined` como padrão e criará o objeto dentro
  da função, sem literal de objeto como parâmetro default.
- Todos os props de componentes serão `Readonly`.
- O componente de composição e os handlers extraídos terão complexidade
  cognitiva de no máximo 15.
- Promessas intencionalmente não aguardadas serão encapsuladas em helpers que
  tratem o erro; não haverá uso decorativo de `void`.
- Textos condicionais de upload e de listas serão calculados antes do JSX, sem
  ternários aninhados.

## Integridade no backend

`papelito_kit_write()` validará pacote e imagem antes de chamar
`WC_Product::save()`. Assim, uma resposta 422 para uma imagem ausente ou
inválida não poderá criar produto WooCommerce nem linha de Kit. A compatibilidade
de atualização para Kits legados que usam preset será preservada.

## Contrato e testes

- O contrato REST documentará que `POST /admin/kits` exige imagem customizada
  válida e que `PUT` preserva a compatibilidade com presets legados.
- O teste standalone do WordPress verificará a rejeição sem escrita e o `PUT`
  de um Kit legado.
- O frontend mockará `fetch` e verificará que salvar sem imagem não dispara
  request, além de exibir o erro.
- O editor de descrição longa terá um caso com espaço final, que a versão
  anterior perdia durante a atualização controlada.

## Validação

Rodar lint, TypeScript, testes Vitest afetados, sintaxe PHP, teste standalone
novo e PHPCS quando o Composer estiver disponível.
