import { isValidCnpj } from "@/lib/validation/brazilian-documents";

/** Mensagem da credencial e se ela é erro. */
export type CnpjMessage = { text: string; error: boolean; retry: boolean };

const CNPJ_LENGTH = 14;

/** Texto inicial da credencial. */
export const CNPJ_IDLE_MESSAGE: CnpjMessage = { text: "Digite no teclado abaixo. A máscara entra sozinha.", error: false, retry: false };

/** Mensagem enquanto digita: quantos faltam ou que já dá para buscar. */
export function typingMessage(digits: string): CnpjMessage {
  if (digits.length === 0) return CNPJ_IDLE_MESSAGE;
  if (digits.length < CNPJ_LENGTH) return { text: `${digits.length} de 14`, error: false, retry: false };
  return { text: "Tudo certo. Agora é só buscar.", error: false, retry: false };
}

/** Erro local antes de buscar, ou `null` quando o CNPJ pode ir à Receita. */
export function localCnpjError(digits: string): CnpjMessage | null {
  if (digits.length < CNPJ_LENGTH) {
    return { text: `O CNPJ tem 14 números. Faltam ${CNPJ_LENGTH - digits.length}.`, error: true, retry: false };
  }
  if (!isValidCnpj(digits)) {
    return { text: "Esse CNPJ não existe. Confere os números com o lojista?", error: true, retry: false };
  }
  return null;
}

const SERVER_MESSAGES: Record<string, CnpjMessage> = {
  papelito_event_cnpj_invalid: { text: "Esse CNPJ não existe. Confere os números com o lojista?", error: true, retry: false },
  papelito_event_cnpj_inactive: { text: "Esse CNPJ está inativo na Receita. Não dá pra vender pra ele.", error: true, retry: false },
  papelito_event_cnpj_not_found: { text: "Não achamos esse CNPJ na Receita. Confere os números?", error: true, retry: false },
};

/** Mensagem do erro da busca; o que não é resposta da Receita oferece "Tentar de novo". */
export function lookupErrorMessage(code: string, serverMessage: string): CnpjMessage {
  if (SERVER_MESSAGES[code]) return SERVER_MESSAGES[code];
  if (code === "papelito_event_rate_limited") return { text: serverMessage, error: true, retry: true };
  if (code.startsWith("papelito_event_") && code !== "papelito_event_cnpj_unavailable") {
    return { text: serverMessage, error: true, retry: false };
  }
  return { text: "A Receita não respondeu.", error: true, retry: true };
}
