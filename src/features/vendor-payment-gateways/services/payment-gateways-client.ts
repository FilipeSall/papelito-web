import type {
  FinancialProfile,
  PaymentPreference,
  PaymentProvider,
  VendorPaymentSummary,
} from "../types/payment-gateways";
import { gatewayErrorMessage } from "../utils/payment-gateway-messages";
import {
  parseFinancialProfile,
  parsePaymentPreference,
  parseVendorPaymentSummary,
} from "../utils/parse-payment-gateways";

/** Resultado de uma chamada às rotas internas: dado já validado ou erro já traduzido. */
export type GatewayRequestResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

type RequestOptions<T> = {
  url: string;
  method: "GET" | "PATCH" | "POST" | "PUT";
  body?: unknown;
  /** Parser fail-closed; `null` vira erro em vez de dado malformado. */
  parse: (data: unknown) => T | null;
};

const RATE_LIMITED_CODE = "papelito_rate_limited";
const INVALID_RESPONSE_CODE = "papelito_invalid_response";

function readCode(body: unknown, status: number): string {
  const code = typeof body === "object" && body !== null ? (body as { code?: unknown }).code : undefined;

  if (typeof code === "string" && code) return code;

  return status === 429 ? RATE_LIMITED_CODE : "";
}

function failure(status: number, code: string): { ok: false; status: number; code: string; message: string } {
  return { ok: false, status, code, message: gatewayErrorMessage(code) };
}

/**
 * Chamada JSON às rotas `/api/*` do painel: corpo tolerante a resposta não-JSON, erro traduzido
 * pelo catálogo (429 sem código vira limite de tentativas) e falha de rede como erro comum.
 */
export async function requestGatewayJson<T>(options: RequestOptions<T>): Promise<GatewayRequestResult<T>> {
  try {
    const response = await fetch(options.url, {
      method: options.method,
      cache: "no-store",
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) return failure(response.status, readCode(body, response.status));

    const data = options.parse(body);

    return data === null ? failure(502, INVALID_RESPONSE_CODE) : { ok: true, data };
  } catch {
    return failure(0, "");
  }
}

function parseAuthorizationUrl(body: unknown): string | null {
  const url = typeof body === "object" && body !== null ? (body as { authorizationUrl?: unknown }).authorizationUrl : null;

  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

function parsePreferenceResponse(body: unknown): PaymentPreference | null {
  const record = typeof body === "object" && body !== null ? (body as { preference?: unknown }) : {};

  return parsePaymentPreference(record.preference);
}

function acceptAnyObject(body: unknown): true | null {
  return typeof body === "object" && body !== null ? true : null;
}

/** Relê o resumo dos gateways do vendor. */
export function fetchVendorPaymentSummary() {
  return requestGatewayJson<VendorPaymentSummary>({
    url: "/api/vendor/payment-gateways",
    method: "GET",
    parse: parseVendorPaymentSummary,
  });
}

/** Reconsulta o estado dos gateways; o WordPress limita a frequência por vendor (429). */
export function refreshVendorPaymentGateways() {
  return requestGatewayJson<VendorPaymentSummary>({
    url: "/api/vendor/payment-gateways/refresh",
    method: "POST",
    parse: parseVendorPaymentSummary,
  });
}

/** Salva o gateway escolhido (exclusivo) com a versão lida; devolve a escolha confirmada pelo servidor. */
export function saveVendorPaymentPreference(preferredProvider: PaymentProvider, configurationVersion: number) {
  return requestGatewayJson<PaymentPreference>({
    url: "/api/vendor/payment-preferences",
    method: "PUT",
    body: { preferredProvider, configurationVersion },
    parse: parsePreferenceResponse,
  });
}

function parseKycUrl(body: unknown): string | null {
  const url = typeof body === "object" && body !== null ? (body as { url?: unknown }).url : null;

  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

/**
 * Cria ou atualiza o recebedor Pagar.me com os dados financeiros já salvos. Não aprova nada:
 * a Pagar.me ainda analisa o cadastro, e a tela relê o resumo para mostrar o estado novo.
 */
export function submitPagarmeRecipient() {
  return requestGatewayJson<true>({
    url: "/api/vendor/recipient",
    method: "POST",
    parse: acceptAnyObject,
  });
}

/** Gera o link temporário de verificação (KYC) da Pagar.me; devolve só a URL HTTPS. */
export function startPagarmeKyc() {
  return requestGatewayJson<string>({
    url: "/api/vendor/recipient/kyc-link",
    method: "POST",
    parse: parseKycUrl,
  });
}

/** Inicia o OAuth do Mercado Pago; devolve só a URL HTTPS de autorização. */
export function startMercadoPagoConnection() {
  return requestGatewayJson<string>({
    url: "/api/vendor/mercadopago/connect",
    method: "POST",
    parse: parseAuthorizationUrl,
  });
}

/** Desconecta a conta Mercado Pago para novas compras, com a senha atual da conta Papelito. */
export function disconnectMercadoPago(currentPassword: string) {
  return requestGatewayJson<true>({
    url: "/api/vendor/mercadopago/disconnect",
    method: "POST",
    body: { currentPassword },
    parse: acceptAnyObject,
  });
}

/** PATCH versionado do perfil financeiro; `currentPassword` só quando o envio é sensível. */
export function patchVendorFinancialProfile(version: number, profile: Record<string, unknown>, currentPassword?: string) {
  return requestGatewayJson<FinancialProfile>({
    url: "/api/vendor/financial-profile",
    method: "PATCH",
    body: currentPassword ? { version, profile, currentPassword } : { version, profile },
    parse: parseFinancialProfile,
  });
}

/**
 * Registra a conferência administrativa de titularidade da conta Mercado Pago de um vendor.
 * `accountId` é a conta exibida ao admin; conta trocada no meio volta como erro 409.
 */
export function registerMercadoPagoIdentity(vendorId: number, accountId: number, status: "mismatch" | "verified", evidenceRef: string) {
  return requestGatewayJson<VendorPaymentSummary>({
    url: `/api/admin/vendors/${vendorId}/mercadopago-identity`,
    method: "POST",
    body: { status, evidenceRef, accountId },
    parse: parseVendorPaymentSummary,
  });
}
