import type { GatewayState } from "../types/payment-gateways";

const STATE_LABELS: Record<GatewayState, string> = {
  unconfigured: "Não configurado",
  connection_pending: "Conexão pendente",
  verification_pending: "Em verificação pela Papelito",
  kyc_pending: "Verificação pendente no gateway",
  ready: "Pronto para receber",
  degraded: "Recebendo, com falha na última atualização",
  unavailable: "Indisponível no momento",
  blocked_cnae: "Pagar.me indisponível para este CNAE",
};

const REASON_LABELS: Record<string, string> = {
  not_connected: "Conecte sua conta do Mercado Pago para receber por ele.",
  reauthorization_required: "A autorização do Mercado Pago expirou ou foi revogada. Conecte de novo.",
  token_expired: "A autorização do Mercado Pago venceu. Conecte de novo.",
  configuration_changed: "A integração foi atualizada. Conecte o Mercado Pago de novo.",
  cnpj_changed: "O CNPJ da loja mudou. Conecte a conta do novo CNPJ.",
  identity_mismatch: "A conta conectada não pertence ao CNPJ da loja.",
  identity_verification_pending: "A Papelito está conferindo se a conta conectada pertence ao CNPJ da loja.",
  regulatory_pending: "O Mercado Pago pediu validações na sua conta. Conclua-as no app ou site do Mercado Pago.",
  refresh_unavailable: "Não conseguimos atualizar a conexão agora; tentaremos de novo.",
  refresh_store_failed: "A renovação da conexão falhou. Conecte o Mercado Pago de novo.",
  gateway_not_configured: "Gateway ainda não habilitado pela Papelito.",
  cnae_restricted: "A atividade da empresa impede o uso da Pagar.me.",
  cnae_verification_pending: "Ainda não conseguimos confirmar a atividade (CNAE) da empresa.",
  last_sync_failed: "A última atualização com a Pagar.me falhou; o recebedor continua ativo.",
  in_review: "Cadastro em análise pela Pagar.me.",
  never_synced: "Complete os dados financeiros para criar o recebedor.",
  sync_error: "A Pagar.me recusou o envio dos dados. Revise as pendências.",
};

const ERROR_MESSAGES: Record<string, string> = {
  papelito_payment_gateway_blocked_cnae: "Pagar.me indisponível para este CNAE",
  papelito_payment_gateway_not_eligible: "Este gateway ainda não pode receber pagamentos da loja.",
  papelito_payment_preference_version_conflict: "A preferência mudou em outra aba. Atualize a página.",
  papelito_payment_preference_version_required: "Atualize a página antes de trocar o gateway que recebe os pedidos.",
  papelito_financial_profile_version_conflict: "Os dados financeiros mudaram em outra sessão. Recarregue antes de salvar.",
  papelito_financial_profile_masked_value: "Informe o dado completo; o valor mascarado não pode ser salvo.",
  papelito_financial_profile_sensitive_removal: "CPF e nascimento do representante não podem ser apagados; informe o novo valor.",
  papelito_financial_profile_invalid_document: "Informe um CPF válido para o representante.",
  papelito_financial_profile_invalid_birthdate: "Informe a data de nascimento do representante no formato dia/mês/ano.",
  papelito_financial_profile_version_required: "Atualize a página antes de salvar os dados financeiros.",
  papelito_financial_profile_encryption_failed: "Não foi possível proteger os dados do representante. Nada foi salvo; tente de novo.",
  papelito_payment_provider_unknown: "Gateway inválido. Atualize a página.",
  papelito_mercadopago_invalid_authorization_url: "Não foi possível iniciar a conexão com o Mercado Pago.",
  papelito_pagarme_cnae_verification_pending: "A atividade da empresa ainda não foi verificada para a Pagar.me.",
  papelito_pagarme_blocked_cnae: "Pagar.me indisponível para este CNAE",
  papelito_payment_attempt_reconciling: "Estamos confirmando o pagamento com o gateway. Acompanhe pelo pedido.",
  papelito_payment_configuration_stale: "As condições de pagamento mudaram. Atualize a página antes de pagar.",
  papelito_payment_vendor_suspended: "Esta loja está sem pagamentos disponíveis no momento.",
  papelito_payment_no_gateway_available: "Nenhuma forma de pagamento está disponível para esta loja agora.",
  papelito_payment_gateways_disabled: "A conexão com o Mercado Pago ainda não está liberada para sua loja.",
  papelito_payment_attempt_closed: "Este pagamento não pode mais ser concluído. Refaça o pedido.",
  papelito_reauthentication_failed: "Não foi possível confirmar a senha atual.",
  papelito_mercadopago_oauth_state_invalid: "A conexão expirou ou foi iniciada em outra sessão. Tente conectar de novo.",
  papelito_mercadopago_oauth_exchange_failed: "O Mercado Pago não confirmou a autorização. Tente conectar de novo.",
  papelito_mercadopago_oauth_environment_mismatch: "A conta autorizada não corresponde ao ambiente de pagamento.",
  papelito_payment_account_collector_in_use: "Esta conta do Mercado Pago já está vinculada a outra loja.",
  papelito_payment_identity_account_changed: "A loja reconectou outra conta do Mercado Pago. Recarregue a página e confira a conta atual.",
  papelito_mercadopago_not_connected: "Não há conta Mercado Pago conectada.",
  papelito_rate_limited: "Muitas tentativas. Aguarde alguns minutos.",
};

const GENERIC_ERROR = "Não foi possível concluir a operação. Tente novamente.";
const GENERIC_REASON = "Verifique o estado com o suporte da Papelito.";

/** Rótulo curto do estado de um gateway para os cards do painel. */
export function gatewayStateLabel(state: GatewayState): string {
  return STATE_LABELS[state];
}

/** Explicação legível de um código de motivo do backend; desconhecido nunca aparece cru. */
export function gatewayReasonLabel(code: string): string {
  return REASON_LABELS[code] ?? GENERIC_REASON;
}

/** Mensagem do catálogo público de erros de gateways (espelha os códigos do WordPress). */
export function gatewayErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? GENERIC_ERROR;
}
