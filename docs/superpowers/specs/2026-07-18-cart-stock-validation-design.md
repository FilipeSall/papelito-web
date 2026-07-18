# Validação de estoque no carrinho

## Contexto e causa

A página `/carrinho` lê os itens persistidos na store Zustand e chama `increaseItem` diretamente. Essa ação soma uma unidade de forma síncrona, sem carregar ou revalidar o estoque do vendor associado ao item. O controle de quantidade também não conhece o limite disponível e nunca desabilita o botão de incremento.

A inclusão inicial de produtos já passa por `resolveCartVendor`, que consulta `coverage/products` com as quantidades desejadas. O checkout WordPress também compara cada linha com `papelito_get_vendor_stock` e a reserva definitiva usa transação e bloqueio `FOR UPDATE`. Portanto, a falha está na ausência de reconciliação e validação fresca durante o carrinho e antes das transições do checkout, não na fonte de estoque.

## Objetivos

- Impedir que qualquer interação de `/carrinho` eleve a quantidade acima do estoque atual do vendor.
- Identificar reduções de estoque ao abrir o carrinho e antes de avançar ou concluir o checkout.
- Falhar de forma segura quando o estoque não puder ser consultado.
- Preservar redução e remoção de itens.
- Manter o WordPress e a tabela de estoque por vendor como fonte de verdade.
- Cobrir a proteção de backend existente com um teste de regressão direto.

## Fora de escopo

- Alterar a política de seleção de vendor ou cobertura por CEP.
- Adicionar um campo editável de quantidade; a interface atual usa apenas os botões `-` e `+`.
- Alterar o cache do catálogo público.
- Refatorar a store ou o checkout fora das mudanças necessárias à validação de estoque.

## Arquitetura proposta

### Consulta fresca e em lote

Uma nova rota interna do Next.js receberá as linhas do carrinho como `productId` e `vendorId`. A rota exigirá sessão de consumidor, obterá o CEP salvo da conta, agrupará linhas por vendor e consultará `GET /papelito/v1/coverage/products` com `vendor_id`, `product_ids` e quantidade mínima igual a 1.

A chamada do Next ao WordPress não terá cache no Next.js. O transient versionado do próprio backend continua válido, pois mudanças feitas por `papelito_set_vendor_stock` ou `papelito_adjust_vendor_stock` incrementam sua versão. A resposta normalizada conterá, para cada produto, o estoque inteiro não negativo e sua disponibilidade no vendor/CEP informados.

O endpoint aceitará múltiplos itens e tratará defensivamente múltiplos vendors, embora o checkout atual exija vendor único. Payloads inválidos serão rejeitados; erros do WordPress serão transformados em um resultado indisponível, nunca em permissão para alterar ou avançar.

### Serviço e reconciliação no cliente

Um serviço da feature `cart` chamará a rota interna e normalizará sua resposta. Uma função pura reconciliará itens e estoque, produzindo:

- itens cuja quantidade continua válida;
- itens reduzidos ao estoque positivo atual;
- itens com estoque zero, preservados no carrinho e marcados como indisponíveis;
- mensagens por produto e o estado global de validação.

Ao montar `/carrinho`, todos os itens serão consultados em lote. Quantidades acima de um estoque positivo serão ajustadas para o novo máximo. Itens zerados não serão removidos silenciosamente: continuarão visíveis para o usuário removê-los conscientemente. Erro de consulta preservará as quantidades, mostrará feedback e bloqueará o avanço.

### Incremento sem corrida

Cada tentativa de incremento consultará novamente o item antes de alterar a store. A quantidade solicitada será `quantidadeAtual + 1` e só será aplicada quando não exceder o estoque retornado.

Uma trava imperativa por produto será adquirida antes da chamada assíncrona, impedindo que cliques consecutivos iniciem validações concorrentes antes do rerender. A store disponibilizará uma atualização condicional que só troca a quantidade quando o valor atual ainda coincide com o valor que foi validado. Assim, uma resposta atrasada não desfará uma redução ou remoção realizada enquanto a consulta estava em andamento.

O botão `+` ficará desabilitado durante a validação, quando a quantidade atingir o estoque e quando o estoque for zero. O botão `-` e a remoção continuarão ativos. Não haverá atualização otimista.

### Feedback

Cada linha poderá exibir uma mensagem persistente com `role="alert"`. Ao exceder o limite, a mensagem será:

`Existem apenas {quantidadeDisponivel} unidades deste produto em estoque.`

Itens zerados mostrarão uma mensagem explícita de indisponibilidade. Falhas de rede ou backend informarão que não foi possível validar o estoque e que o usuário deve tentar novamente. A página indicará quando estiver validando para evitar que o estado pareça travado.

### Transições para o checkout

O link direto “Finalizar Compra” será substituído por uma ação que revalida todas as linhas. A navegação só ocorrerá quando a consulta concluir e todas as quantidades permanecerem válidas. Se uma redução positiva for identificada, o carrinho será ajustado, os totais serão recalculados e a navegação será interrompida para o usuário revisar. Estoque zero ou erro também bloqueiam o avanço.

Na revisão do checkout, o clique em “Finalizar pedido” executará a mesma validação fresca antes de chamar `placeOrder`. Qualquer mudança ou indisponibilidade interromperá o envio e orientará o usuário a retornar ao carrinho. Isso também evita concluir com frete calculado para uma quantidade que acabou de mudar.

O backend continuará validando novamente no `place-order`, cobrindo requisições diretas e mudanças ocorridas entre a última consulta do frontend e a reserva.

## Proteção do backend

`papelito_order_routing_resolve_items` já rejeita cada linha cuja quantidade seja maior que `papelito_get_vendor_stock`, retornando HTTP 409 com produto, quantidade disponível e solicitada. Depois da criação do pedido, `papelito_pagarme_reserve_order_stock` chama `papelito_adjust_vendor_stock`; essa função bloqueia a linha com `FOR UPDATE`, rejeita saldo negativo e reverte reservas parciais de múltiplas linhas.

Não será duplicada uma segunda regra funcional. Será criado um teste PHP standalone que chama diretamente a resolução das linhas com stubs controlados e confirma que quantidade igual ao estoque é aceita e quantidade superior ou estoque zero são rejeitados com o código e dados esperados. A reserva transacional permanece a proteção final contra concorrência real.

## Testes

Os testes Vitest cobrirão serviço, store/função de reconciliação e componentes:

1. incremento abaixo do estoque;
2. quantidade igual ao estoque;
3. bloqueio acima do estoque;
4. mensagem de limite;
5. botão `+` desabilitado no limite;
6. redução e remoção preservadas;
7. produto com estoque zero;
8. redução detectada ao carregar e antes do checkout;
9. cliques consecutivos e resposta atrasada;
10. erro de consulta bloqueando alteração e checkout;
11. múltiplos itens reconciliados independentemente;
12. checkout final revalidando antes de `placeOrder`.

O teste PHP standalone cobrirá a rejeição direta no backend. A validação final incluirá os testes direcionados, suíte Vitest, lint, build, `php -l` nos PHP alterados e execução do teste PHP.

## Critérios de aceitação

- Nenhum controle da página do carrinho envia à store uma quantidade não validada acima do estoque.
- Nenhuma transição do carrinho ou revisão do checkout avança quando a consulta falha ou detecta divergência.
- Itens com estoque zero permanecem visíveis e removíveis, mas não incrementáveis nem finalizáveis.
- O backend rejeita payload direto acima do estoque e a reserva atômica continua impedindo saldo negativo sob concorrência.
- O catálogo público, sua estratégia ISR e seu cache de disponibilidade não são alterados.
