# Envio manual pelos Correios

## Decisão

Com a pré-postagem desabilitada, o vendor mantém a etapa de separação e, após
postar fisicamente o pacote, informa o código S10 no Papelito. A confirmação
registra a data de postagem e move o pedido para `enviado`; o Rastro continua
sendo a fonte de confirmação de entrega.

## Regras

- A interface não mostra nem chama geração de etiqueta quando o modo de
  pré-postagem está `disabled`.
- O código é obrigatório, validado como S10 e protegido contra associação a
  outro pedido.
- Replays idênticos são idempotentes. O vendor responsável pode corrigir o
  código até a entrega; correções posteriores são administrativas e auditadas.
- O customer recebe o código e o link oficial dos Correios, sem metadados de
  provider, pré-postagem ou erro interno.
- Pedidos multipartes existentes continuam exibindo cada código. Esta entrega
  não cria uma nova modelagem de itens por pacote.
