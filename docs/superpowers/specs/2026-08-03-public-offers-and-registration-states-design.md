# Ofertas públicas e estados de cadastro

## Objetivo

Eliminar afirmações públicas divergentes, garantir que uma campanha relâmpago prevaleça sobre qualquer outra promoção e tornar os estados sem candidatura e de navegação inacessíveis explicitamente corretos.

## Escopo

1. Remover a mensagem de fallback de frete grátis da faixa promocional. Sem configuração remota, a faixa não deve prometer frete.
2. Quando uma campanha relâmpago válida estiver associada a um produto, ela prevalece sobre cupom e sobre o preço promocional normal em home, detalhe, carrinho e checkout.
3. Registrar a pendência de aferição confiável de idade no fluxo de autenticação, sem mudar o comportamento atual.
4. Exibir `14.536.755/0001-10` no rodapé público.
5. Sem o cookie de candidatura, `/cadastro/analise` deve sair do carregamento e orientar o visitante a reiniciar o fluxo, preservando o `404` neutro da API.
6. O loader de navegação só existe no DOM enquanto está ativo.

## Desenho

O WordPress continua sendo a autoridade de preço. Para cada produto, o backend resolve por `product_id` se há campanha ativa; o contexto assinado do navegador é apenas compatibilidade e nunca uma condição para conceder a campanha. A campanha válida é escolhida de forma incondicional para sua linha. Antes do rateio, essas linhas são excluídas da elegibilidade do cupom, que segue válido para as demais. A resposta de preço mantém `discountSource = flash_sale` e não contabiliza desconto de cupom na linha participante.

O frontend reutiliza a campanha pública já consultada pela home para enriquecer o produto de detalhe com `price`, `originalPrice`, `discountPercent` e `promotionContext`. O botão de adicionar ao carrinho envia esse contexto; o backend o valida novamente. Produto fora da campanha mantém o mapeamento normal do WPGraphQL.

A rota de análise mantém sua API sem enumeração de candidatura. A página modela `loading`, `loaded`, `missing` e `error`, mostrando CTA somente quando a candidatura estiver ausente e uma tentativa de recarga no erro técnico. O loader global retorna `null` quando não está carregando, removendo o status da árvore de acessibilidade em vez de apenas escondê-lo.

## Testes

- Frontend: fallback de frete não contém promessa de valor; campanha sobrescreve o preço do detalhe; análise sem cookie exibe estado recuperável; loader inativo não monta `role=status`.
- Backend: um cupom mais vantajoso que a campanha não substitui uma campanha válida; em carrinho misto, o cupom é rateado integralmente apenas entre linhas sem campanha.
- Validação final: lint, TypeScript, testes e build do frontend; lint PHP e teste standalone de preço no backend.

## Fora de escopo

Implementar verificação de idade, trocar a configuração administrativa das campanhas ou criar uma API geral de configuração legal do site.
