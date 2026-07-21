# Design — fallback manual após falha segura da Pré-Postagem

Data: 21/07/2026  
Escopo: `papelito-wordpress` e `papelito-web`

## Objetivo

Oferecer o cadastro manual do código S10 somente depois que uma tentativa de
geração automática falhar de modo comprovadamente seguro. O fluxo não pode liberar
o fallback quando existir risco de a Pré-Postagem ter sido criada, pois cadastrar
outro objeto poderia duplicar postagem e cobrança.

## Comportamento do vendor

Para um pedido pago, em separação e sem shipment ativo:

1. inicialmente aparece apenas **Gerar etiqueta dos Correios**;
2. o clique chama o endpoint automático existente;
3. sucesso mostra a etiqueta e não oferece cadastro manual;
4. falha segura mostra a mensagem específica e libera o formulário manual;
5. falha incerta, geração em andamento ou etiqueta existente não libera o manual;
6. a liberação persiste depois de atualizar a página ou entrar novamente.

O formulário manual contém o seguinte aviso antes do input:

> Não foi possível gerar a etiqueta automaticamente.
>
> 1. Gere a etiqueta no portal de Pré-Postagem dos Correios ou leve o pacote e os
>    documentos a uma agência.
> 2. Use o mesmo serviço escolhido no pedido — PAC ou SEDEX.
> 3. Copie o código de rastreamento de 13 caracteres da etiqueta ou comprovante e
>    informe abaixo.

O Papelito recebe apenas o S10. Ele não presume que gerou ou pagou a etiqueta
externa e não promete rastreamento se a credencial Rastro não puder consultar o
objeto.

## Regra de segurança

Fallback manual exige simultaneamente:

- `PAPELITO_CORREIOS_MANUAL_TRACKING_ENABLED=true`;
- pedido pertencente ao vendor, com pagamento confirmado e no estado `em_separacao`;
- nenhum shipment ativo;
- tentativa automática canônica com `generation_status=failed` e `active=0`;
- código de erro pertencente à lista pública segura;
- `creation_outcome=not_created` persistido na tentativa;
- `manual_fallback_eligible=1` explicitamente gravado por esta versão do fluxo.

Erros seguros previstos, sempre condicionados à prova explícita `not_created`:

- integração/provider não configurado;
- serviço de Pré-Postagem ausente no contrato/cartão;
- credencial inválida ou chave sem permissão;
- dados obrigatórios inválidos/rejeitados antes da criação;
- rate limit ou indisponibilidade quando o adapter puder afirmar `not_created`.

Nunca liberam fallback:

- `generating`;
- `uncertain`;
- timeout ou conexão encerrada sem confirmação do resultado;
- tentativa duplicada;
- etiqueta/prepostagem já existente;
- erro interno sem `creation_outcome=not_created`.

## Persistência e backend

A tabela `papelito_shipments` já representa tentativas e possui
`generation_status`, `idempotency_key`, `active` e `last_error_code`. Ela será
reutilizada, sem criar estado paralelo no React ou em order meta, com três campos
novos:

- `creation_outcome`: `not_created|created|uncertain`;
- `manual_fallback_eligible`: `0|1`, default `0`;
- `manual_fallback_consumed_at`: data UTC opcional.

Registros anteriores à migração recebem `manual_fallback_eligible=0`. Portanto,
nenhuma falha histórica se torna elegível por inferência.

O fluxo automático passa a reservar a tentativa antes da checagem de readiness.
Quando readiness ou provider devolver erro:

- `creation_outcome=not_created` **e código allowlisted**: tentativa vira `failed`,
  `active=0`, `creation_outcome=not_created` e `manual_fallback_eligible=1`;
- `creation_outcome=not_created` sem código allowlisted: tentativa vira `failed`,
  mas o fallback permanece `0`;
- qualquer resultado não explicitamente `not_created`: tentativa vira `uncertain`,
  `active=1`, `creation_outcome=uncertain` e fallback `0`.

O status HTTP nunca libera fallback sozinho. Por exemplo, um 404 com
`not_created` pode liberar; o mesmo 404 sem essa classificação vira `uncertain`.

O snapshot resolve a tentativa automática canônica pela chave idempotente estável
do pedido/vendor/pacote/versão/provider, não apenas por “último ID”. Duplicatas e
replays nunca substituem essa tentativa. Ele expõe somente:

- `manual_fallback_available: boolean`;
- `generation_error_code`: enum pública allowlisted, sem mensagem externa bruta.

O endpoint automático inclui `manual_fallback_available` no erro para a UI abrir o
formulário imediatamente. O endpoint manual repete toda a validação no servidor;
alterar o React ou chamar a rota diretamente não contorna a regra.

Respostas de erro possuem contrato estável. A função backend
`papelito_tracking_manual_fallback_error_catalog()` será a fonte canônica e um
teste de contrato verificará o espelho TypeScript:

| `code` público | `category` | Mensagem segura após refresh |
|---|---|---|
| `papelito_correios_integration_not_configured` | `not_configured` | A geração automática ainda não está configurada. |
| `papelito_correios_provider_not_implemented` | `not_configured` | A integração de Pré-Postagem ainda não está disponível. |
| `papelito_correios_credentials_invalid` | `invalid_credentials` | As credenciais dos Correios precisam ser atualizadas pelo suporte. |
| `papelito_correios_service_not_authorized` | `not_authorized` | A chave configurada não tem permissão para gerar etiquetas. |
| `papelito_correios_service_not_contracted` | `not_contracted` | O contrato ou cartão não possui a API de Pré-Postagem. |
| `papelito_correios_data_incomplete` | `invalid_order` | O pedido não possui todos os dados obrigatórios. |
| `papelito_correios_validation_failed` | `validation` | Os Correios rejeitaram os dados da postagem. |
| `papelito_correios_rate_limited` | `temporarily_unavailable` | Os Correios limitaram temporariamente as solicitações. |
| `papelito_correios_unavailable` | `temporarily_unavailable` | O serviço dos Correios está temporariamente indisponível. |

Somente esses códigos, combinados com `creation_outcome=not_created`, podem gravar
`manual_fallback_eligible=1`. Código desconhecido nunca é promovido ao catálogo.
O snapshot devolve o `generation_error_code`; o frontend encontra a mensagem na
enumeração espelhada e usa uma mensagem genérica segura apenas como defesa.

```json
{
  "code": "papelito_correios_service_not_contracted",
  "category": "not_contracted",
  "message": "O contrato ou cartão não possui a API de Pré-Postagem.",
  "retryable": false,
  "manual_fallback_available": true
}
```

No endpoint manual, 403 representa feature flag/permissão, 409 conflito de estado
ou fallback ausente/consumido e 422 S10 inválido.

Depois do cadastro manual, o shipment `provider=manual` torna-se ativo e o fallback
é consumido atomicamente. A tentativa automática falha permanece inativa para
auditoria.

### Concorrência e idempotência

O backend, e não apenas o React, bloqueia nova geração automática enquanto a
tentativa canônica possui `manual_fallback_eligible=1`. Reabrir a geração automática
exigirá uma ação explícita de suporte, fora deste escopo.

Cadastro manual e geração automática serializam sobre a mesma tentativa canônica
em transação com `SELECT ... FOR UPDATE`:

1. o endpoint manual bloqueia a tentativa elegível;
2. revalida pagamento, status, ownership, ausência de shipment ativo e elegibilidade;
3. cria o shipment manual com chave idempotente única derivada de
   `manual|pedido|vendor|pacote|versão`;
4. consome o fallback e confirma a transação.

Duas submissões manuais simultâneas não criam dois shipments. Replay com o mesmo
S10 retorna o snapshot existente; S10 diferente depois do consumo retorna 409. A
unicidade global do S10 continua impedindo associação a outro pedido.

## Frontend

`VendorOrderActions` recebe `manualFallbackAvailable`, inicializa estado local com
o snapshot e o atualiza a partir do erro estruturado do POST automático.

- antes da falha: botão automático;
- após falha segura: alerta + bloco explicativo + input S10 + botão de cadastro;
- após falha insegura: somente alerta; nenhuma entrada manual;
- após sucesso: refresh e ações de etiqueta/rastreamento existentes.

O bloco manual será um `section` com título, lista ordenada curta, exemplo de S10 e
aviso de que custos/documentos são tratados no canal externo dos Correios.

## Erros e recuperação

O botão automático poderá ser tentado novamente apenas enquanto não houver estado
`generating`, `uncertain` ou fallback manual aberto. Uma falha segura que liberou o
manual esconderá o botão automático e o endpoint também recusará uma chamada
direta. Nova tentativa automática exigirá ação futura específica de
suporte/reabertura, fora deste escopo.

O cadastro manual aceita somente S10 no formato `AA123456789BR`, normalizado em
maiúsculas. O formato não prova existência; o Rastro continuará sendo a fonte dos
eventos postais.

## Testes e aceite

Backend:

- integração desabilitada cria tentativa `failed/not_created`, marcada por esta
  versão, e libera manual;
- 401, 403, 404, 422 e indisponibilidade só liberam manual quando acompanhados de
  `creation_outcome=not_created`; os mesmos HTTPs sem prova viram `uncertain`;
- `generating`, `uncertain`, duplicate, registro legado e erro sem `not_created`
  bloqueiam manual;
- chamada direta ao endpoint manual sem tentativa segura retorna 409/403;
- dois cliques automáticos continuam produzindo uma única reserva;
- cadastro manual cria um shipment ativo e consome o fallback.
- concorrência manual×manual cria no máximo um shipment;
- concorrência manual×automático é serializada e nunca cria os dois fluxos;
- pedido sem pagamento confirmado nunca libera nem consome fallback;

Frontend:

- formulário não aparece inicialmente;
- erro seguro o revela imediatamente com o checklist;
- erro incerto não o revela;
- snapshot persistido o mantém após refresh;
- S10 inválido não chama o endpoint;
- lint, testes e build passam.

## Fora do escopo

- upload de PDF criado externamente;
- pagamento da etiqueta externa;
- retry/reconciliação automática de resultado incerto;
- implementação do adapter real sem OpenAPI;
- garantia de que todo S10 manual é consultável pela credencial Rastro.
