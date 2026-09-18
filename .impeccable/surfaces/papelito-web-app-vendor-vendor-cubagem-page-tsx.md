---
version: 1
slug: "papelito-web-app-vendor-vendor-cubagem-page-tsx"
primary_target: "papelito-web/app/(vendor)/vendor/cubagem/page.tsx"
related_targets: ["papelito-web/src/components/layout/vendor-panel/vendor-packaging-manager.tsx","papelito-web/src/features/vendor-packaging/types/vendor-packaging.ts","papelito-wordpress/public_html/wp-content/plugins/plugin_papelito/includes/packaging.php"]
---

# /vendor/cubagem — cubagem do vendor

## Escopo e modo

Operate. Rota única `/vendor/cubagem` no painel do vendor, com o manager, o feature e a rota de API que a servem. Fora do escopo: o contrato de embalagem no WordPress, a escolha automática de caixa e a página de configurações da Braspress.

## Quem, o quê

Vendor regional — distribuidora ou tabacaria. Cena confirmada em 17/09: **setup de entrada**. Cadastra três a seis caixas quando entra e só volta quando troca de fornecedor de caixa. A tela precisa ser excelente na primeira visita e discreta depois.

Tarefa: registrar as caixas físicas que a loja usa — medidas internas, tara, carga máxima — preenchendo por um dos 21 modelos RPC do catálogo ou criando caixa própria.

Conteúdo real: catálogo RPC de 21 modelos em seis categorias (Pequena, Comprida, Média, Grande, Super, Híper); perfis do vendor com código único, versão, ativo/inativo e origem `rpc` ou `custom`.

## Restrições

- O formulário fala cm/kg; o contrato persiste mm/g. A conversão é do front, e o erro de campo volta do WordPress mapeado por nome.
- Editar incrementa a versão; desativar preserva a linha e o histórico.
- **Não existe endpoint de reativação.** Decisão de 17/09: a página oferece reativar e a rota é pendência aberta no plugin.
- **O front não calcula encaixe.** `missingFields` do estoque diz apenas *que* falta peso ou dimensão, nunca os valores; resolver qual caixa sai em qual pedido é do WordPress, e a rota não existe.
- Sem caixa aplicável a Braspress não cota. O piso de três caixas ativas é informativo, não bloqueio.
- Conta suspensa congela o cadastro; a página já trata esse estado antes do manager.

## Decisões em aberto

1. Rota `POST /vendor/me/packaging/reactivate/{id}` no plugin — a única que destrava o botão de reativar.
2. Rota de resolução de caixa por conjunto de linhas, que tornaria a relação caixa × pedido literal em vez de inferida pela prontidão.

## Direction contract

**THESIS.** A página é a entrada do vendor no assunto embalagem: conduz na primeira vez e encolhe para lista depois. Recusa o arranjo padrão do painel — lista à esquerda e formulário permanente de 380px à direita — que cobra a mesma área de tela para sempre por uma tarefa que acontece uma vez.

**OWN-WORLD.** Camada dura da Papelito, a mesma de `/vendor/estoque` e `/admin/contas`: kraft `#fbf7ef` de chão, chapa branca recebendo dado, tinta `#1a1a1a` em borda de 2px, amarelo `#ffe500` em faixa de topo, losango de seção e sombra de ação. Sombra sólida com offset, blur nenhum, canto reto em tudo. Inter 900 em caixa alta com tracking largo na voz de comando, IBM Plex Mono no código da caixa e no numeral. Estado é chip com ícone mais texto.

**STORY.** O vendor entende que a plataforma precisa saber em que caixa ele despacha; acredita que escolher os modelos que já usa é questão de minutos; e sai com as caixas cadastradas e sabendo o que ainda falta para a Braspress cotar.

**FIRST VIEWPORT.** Faixa de marcos no topo, três passos com estado: escolher modelos, conferir medidas, pronto para despachar. Abaixo e à esquerda, a grade dos 21 modelos RPC como cartelas selecionáveis, cada uma com silhueta proporcional, código, medidas e carga, agrupadas por categoria. À direita, coluna estreita acumulando as caixas escolhidas, com a ação primária no pé dela. O rodapé é a barra de prontidão: caixas ativas contra o piso de três e os produtos do estoque sem peso ou dimensão, que não entram em conta nenhuma. Caixa própria é uma cartela tracejada dentro da mesma grade, não um formulário à parte.

**FORM.** Linha de montagem, índice 4 da lista ordenada, sorteada como lead. Seed key `8e69f9f3`.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
