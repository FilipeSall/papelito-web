/**
 * Um campo que a Pagar.me recusou na última tentativa de sincronização.
 *
 * `label` e `hint` vêm traduzidos do WordPress; `detail` é a frase de validação da Pagar.me,
 * sanitizada e encurtada, porque é ela que distingue "campo obrigatório" de "valor longo demais".
 */
export type VendorRecipientRejectedField = {
  detail: string;
  field: string;
  group: string;
  hint: string;
  label: string;
};

export type VendorRecipient = {
  recipientId: string;
  status: string;
  kycStatus: string;
  kycStatusReason: string;
  lastSyncAt: string;
  lastError: string;
  lastErrorCode: string;
  loadFailed: boolean;
  rejectedFields: VendorRecipientRejectedField[];
};
