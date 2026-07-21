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
reutilizada, sem criar estado paralelo no React ou em order meta, com quatro campos
novos:

- `creation_outcome`: `not_created|created|uncertain`;
- `manual_fallback_eligible`: `0|1`, default `0`;
- `manual_fallback_consumed_at`: data UTC opcional.
- `is_test`: `0|1`, default `0`, marca imutável de shipment sem validade postal.

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
| `papelito_correios_dev_health_unhealthy` | `dev_health_unhealthy` | A verificação local indicou que a integração não está disponível. |
| `papelito_correios_dev_health_unknown` | `dev_health_unknown` | Não foi possível confirmar a saúde da integração no teste local. |

Somente esses códigos, combinados com `creation_outcome=not_created`, podem gravar
`manual_fallback_eligible=1`. Os dois códigos `dev_health_*` exigem adicionalmente
o modo local seguro descrito abaixo; eles são recusados nos demais ambientes.
Código desconhecido nunca é promovido ao catálogo.
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

## Comportamento exclusivo do ambiente local

O ambiente local usará um modo híbrido de desenvolvimento: a saúde pode ser
verificada contra uma fonte configurável, mas a geração permanece sempre mockada.
Uma resposta saudável jamais autoriza o ambiente local a criar uma Pré-Postagem
real.

O fluxo do clique em **Gerar etiqueta dos Correios** será:

1. consultar o resultado de saúde em cache;
2. com saúde `healthy`, executar o adapter mock e criar `prepost_id`, S10 e PDF
   fictícios, aceitos pelo Papelito somente no ambiente local;
3. com saúde `unhealthy` ou `unknown`, não gerar o fake, persistir uma falha local
   com `creation_outcome=not_created` e liberar o mesmo formulário manual;
4. o código informado manualmente segue as validações e a auditoria do fluxo
   manual normal, mas é marcado como teste e não entra no polling real por
   default.

Neste modo não existe risco de criação remota incerta: nenhum `POST` de
Pré-Postagem é executado. Por isso, inclusive timeout da verificação de saúde
pode abrir o fallback local com `not_created`. Essa regra é exclusiva de
desenvolvimento e não altera a classificação conservadora de erros em produção.

### Fonte da saúde

A configuração local separa duas decisões:

- `PAPELITO_CORREIOS_PREPOST_MODE=mock`: provider de geração, obrigatoriamente
  mock;
- `PAPELITO_CORREIOS_DEV_HEALTH_SOURCE=mock|real`: origem da saúde.

O default é `mock`, com cenários determinísticos `healthy`, `unhealthy` e
`unknown`. A fonte `real` exige ativação explícita e credencial autorizada. Ela
faz somente consultas não destrutivas de autenticação/contrato/serviço, sem
criar, cancelar ou reemitir objeto. O resultado é armazenado em cache por 15
minutos, protegido por lock, com timeout curto, zero retry automático e redaction
de credenciais. Cliques simultâneos compartilham a mesma verificação.

A chave de cache inclui ambiente, fonte, cenário, contrato, cartão e um fingerprint
não reversível da credencial calculado com HMAC e salt do servidor. O segredo e o
fingerprint nunca aparecem em resposta ou log. Troca de contrato, cartão,
credencial, fonte ou cenário invalida naturalmente o cache anterior.

`healthy` requer a autenticação válida e a confirmação do serviço de
Pré-Postagem para o contrato/cartão configurado. Falha confirmada resulta em
`unhealthy`; timeout, `429` ou `5xx` resulta em `unknown`. A interface informa a
diferença, embora ambos liberem o manual local por não ter havido criação real.

### Fake válido somente no Papelito

O adapter mock gera:

- identificador de pré-postagem com namespace de teste;
- S10 sintaticamente válido para as regras internas, com dígito verificador;
- `provider=mock` e `is_test=1` persistidos;
- PDF com marca d'água **SEM VALIDADE POSTAL**;
- eventos de rastreamento por fixtures locais para simular postado, em trânsito,
  entregue, cancelado e expirado.

O polling real ignora todo shipment `is_test=1`, incluindo `provider=mock` e o
S10 cadastrado manualmente no fluxo local. O S10 fake não é enviado a nenhum
endpoint dos Correios, não pode ser usado para postagem e não representa uma
etiqueta contratada. O objetivo de “válido” é permitir testar integralmente as
telas, validações, download, estados e auditoria locais. O PDF simulado exige
simultaneamente `provider=mock` e `is_test=1`. As fixtures de rastreamento aceitam
`provider IN (mock, manual)` somente com `is_test=1` e ambiente local permitido.
Assim, o manual local pode simular eventos sem ganhar uma etiqueta que o sistema
não gerou; um campo isolado nunca promove um registro ao fluxo mock.

O cadastro manual local também grava `is_test=1` e usa fixtures/sem rede por
default. Consultar um S10 manual real a partir do local exige a flag separada
`PAPELITO_CORREIOS_DEV_ALLOW_REAL_TRACKING=true`, credencial autorizada e uma
confirmação explícita na ação; nesse caso o registro não é tratado como fake.
Essa flag nunca é inferida da fonte de saúde e permanece desligada por default.

### Recuperação depois de saúde ruim

Uma falha local elegível exibe, além do manual, **Tentar geração simulada
novamente**. A ação usa um endpoint autenticado registrado apenas no ambiente
local permitido. Em transação, ele verifica ownership, pagamento, separação,
ausência de shipment ativo e fallback ainda não consumido; encerra a tentativa de
teste anterior sem apagá-la e incrementa a versão da chave idempotente. Só então
uma nova verificação de saúde pode gerar o fake. Se um S10 manual já tiver sido
cadastrado, a reabertura retorna 409.

Esse reset é exclusivo de tentativas `is_test=1`. A rota nem sequer é registrada
em produção ou staging e não pode reabrir uma tentativa real/incerta.

O bootstrap falha de forma fechada se `mock`, `DEV_HEALTH_SOURCE` ou qualquer flag
`DEV_*` deste fluxo for configurada fora da allowlist exata
`WP_ENVIRONMENT_TYPE=local|development`. Staging é bloqueado como produção. A
suíte unitária usa injeção de dependência própria, não amplia essa allowlist de
runtime. Além da checagem ambiental, `is_test=1` impede que respostas mock sejam
tratadas como shipments reais ou reaproveitadas depois de migração/deploy.

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
- no local, saúde mock `healthy` gera apenas etiqueta fake e nunca chama criação
  real;
- no local, saúde `unhealthy` ou `unknown` libera o manual depois do erro;
- fonte de saúde real usa cache/lock, não faz retry e nunca executa operação
  destrutiva;
- shipment mock nunca é enviado ao polling real;
- `provider=manual,is_test=1` usa fixture e não chama Rastro por default;
- `provider=manual,is_test=0` nunca usa fixture;
- opt-in de rastreamento real é bloqueado sem flag, credencial e confirmação;
- troca `unhealthy` para `healthy`, após reset local auditado, gera o fake;
- reset local não funciona depois de cadastro manual nem para tentativa real;
- configuração mock em staging ou produção falha de forma fechada;
- cache de saúde muda com ambiente, cenário, contrato, cartão ou credencial;
- códigos locais `unhealthy` e `unknown` persistem e produzem mensagens distintas;

Frontend:

- formulário não aparece inicialmente;
- erro seguro o revela imediatamente com o checklist;
- erro incerto não o revela;
- snapshot persistido o mantém após refresh;
- saúde local válida conclui o fluxo com PDF e rastreamento simulados;
- saúde local inválida ou inconclusiva mostra o aviso e o input manual;
- S10 inválido não chama o endpoint;
- lint, testes e build passam.

## Fora do escopo

- upload de PDF criado externamente;
- pagamento da etiqueta externa;
- retry/reconciliação automática de resultado incerto;
- implementação do adapter real sem OpenAPI;
- garantia de que todo S10 manual é consultável pela credencial Rastro.
