# Interesses dentro da área de Vendors

## Contexto

As manifestações de interesse em se tornar vendor já possuem listagem e detalhe administrativos, mas estavam expostas como uma seção independente em `/admin/vendor-interests`. A navegação deve representar um único domínio administrativo: vendors cadastrados e customers que manifestaram interesse.

## Decisão

- Manter `/admin/vendors` como única entrada de navegação.
- Exibir duas abas na página: `Vendors cadastrados` e `Interesses em ser vendor`.
- Controlar a aba de interesses por `/admin/vendors?tab=interesses`.
- Manter busca e paginação na URL da aba ativa.
- Mover o detalhe para `/admin/vendors/interesses/[id]`, preservando uma URL direta e compartilhável.
- Buscar somente os dados necessários para a aba ativa.
- Preservar os endpoints, contratos, persistência e autorização administrativos existentes.

## Interface

As abas reutilizam a paleta, bordas, tipografia em caixa alta e estados de foco do painel. Em telas estreitas, a navegação permite rolagem horizontal sem truncar os rótulos. A ação `Novo vendor` permanece na aba de vendors cadastrados; a aba de interesses é focada em busca, leitura e contato.

## Rotas removidas

- `/admin/vendor-interests`
- `/admin/vendor-interests/[id]`

Links de notificações, listagem, paginação e retorno do detalhe passam a usar as rotas sob `/admin/vendors`.
