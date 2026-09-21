/** Qual comando falhou, porque a mesma falha se explica diferente em cada passo. */
export type BraspressAction = "reauth" | "remove" | "save";

/**
 * Envelope de erro que `/api/vendor/braspress` devolve.
 *
 * `message` existe para o chamador não ter de removê-lo antes de chamar aqui, e
 * é **deliberadamente ignorado**: a resposta do WordPress não vai para a tela.
 */
export type BraspressErrorEnvelope = {
  code?: string;
  message?: string;
  status: number;
};

const BY_CODE: Record<string, string> = {
  papelito_account_suspended:
    "Sua conta está suspensa para operações comerciais. Fale com a Papelito para voltar a alterar a integração.",
  papelito_vendor_auth_required: "Sua sessão expirou. Entre de novo para alterar a integração.",
  papelito_vendor_forbidden: "Esta ação não é permitida para a sua conta.",
  papelito_vendor_integration_credentials_incomplete:
    "Informe usuário e senha juntos. Deixe os dois em branco para manter a credencial que já está salva.",
  papelito_vendor_integration_current_password_invalid:
    "A senha atual não confere. É a senha da Papelito que confirma a alteração, não a da Braspress.",
  papelito_vendor_integration_delete_failed:
    "Não foi possível remover agora. A integração continua exatamente como estava.",
  papelito_vendor_integration_encrypt_failed:
    "Não foi possível proteger a credencial. Tente de novo; a configuração anterior continua valendo.",
  papelito_vendor_integration_forbidden: "Esta ação não é permitida para a sua conta.",
  papelito_vendor_integration_invalid_origin_cep:
    "O CEP de origem precisa ter 8 dígitos. Deixe em branco para usar o CEP do cadastro da loja.",
  papelito_vendor_integration_profile_incomplete:
    "Complete o CNPJ no cadastro da sua loja antes de habilitar a Braspress.",
  papelito_vendor_integration_rate_limited:
    "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
  papelito_vendor_integration_reauth_ticket_invalid:
    "A confirmação de senha expirou. Confirme sua senha de novo para concluir.",
  papelito_vendor_integration_save_failed:
    "Não foi possível salvar agora. A configuração anterior continua valendo.",
  papelito_vendor_integration_secret_invalid:
    "A credencial salva não pode mais ser lida. Cadastre usuário e senha de novo.",
  papelito_vendor_integration_secret_unavailable:
    "A credencial salva não pode mais ser lida. Cadastre usuário e senha de novo.",
};

const BY_STATUS: Record<number, string> = {
  401: "Sua sessão expirou. Entre de novo para alterar a integração.",
  403: "Esta ação não é permitida para a sua conta.",
};

const FALLBACK: Record<BraspressAction, string> = {
  reauth: "Não foi possível confirmar sua senha. Tente novamente.",
  remove: "Não foi possível remover a integração. Tente novamente.",
  save: "Não foi possível salvar a integração. Tente novamente.",
};

/**
 * Mensagem do catálogo para o código, se — e somente se — ele existir lá.
 *
 * A consulta é por propriedade própria de propósito: `BY_CODE` é um objeto
 * literal, e um `code` como `toString` ou `__proto__` resolveria pela cadeia de
 * protótipos e devolveria uma função no lugar da frase para o vendor.
 */
function catalogMessage(code: string | undefined): string | undefined {
  if (!code || !Object.hasOwn(BY_CODE, code)) return undefined;

  return BY_CODE[code];
}

/**
 * Mensagem acionável para o vendor a partir do código de erro do backend.
 *
 * O texto do WordPress nunca chega à tela: código desconhecido cai numa frase
 * fixa da ação, para que um erro novo — ou um erro que carregue detalhe técnico —
 * não vire vazamento. O catálogo espelhado aqui está em
 * `docs/integration-contracts.md`, na seção da rota da integração.
 */
export function braspressErrorMessage(
  error: BraspressErrorEnvelope,
  action: BraspressAction,
): string {
  return catalogMessage(error.code) ?? BY_STATUS[error.status] ?? FALLBACK[action];
}
