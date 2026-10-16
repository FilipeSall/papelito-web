import type {
  CheckoutPaymentFlow,
  CheckoutPaymentProvider,
  PaymentMethod,
  PlaceOrderPaymentResult,
} from "../types/checkout";
import { isAllowedMercadoPagoUrl } from "./mercado-pago-redirect";

const PROVIDERS: readonly CheckoutPaymentProvider[] = ["mercadopago", "pagarme"];
const FLOWS: readonly CheckoutPaymentFlow[] = ["direct", "redirect", "requires_payment_input"];
const METHODS: readonly PaymentMethod[] = ["credit_card", "pix", "boleto"];
const AWAITING_INPUT_STATE = "awaiting_payment_input";

type NewPaymentFields = {
  provider: CheckoutPaymentProvider;
  flow: CheckoutPaymentFlow;
  paymentAttemptId: number;
  state: string;
  method: unknown;
  redirectUrl: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProvider(value: unknown): value is CheckoutPaymentProvider {
  return typeof value === "string" && (PROVIDERS as readonly string[]).includes(value);
}

function isFlow(value: unknown): value is CheckoutPaymentFlow {
  return typeof value === "string" && (FLOWS as readonly string[]).includes(value);
}

/** Diz se o valor é um dos métodos Pagar.me que o checkout conhece. */
export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (METHODS as readonly string[]).includes(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isRedirectConsistent({ provider, state, redirectUrl }: NewPaymentFields) {
  if (provider !== "mercadopago") return false;
  if (redirectUrl !== undefined && !isAllowedMercadoPagoUrl(redirectUrl)) return false;

  return state !== "pending" || isAllowedMercadoPagoUrl(redirectUrl);
}

function isRequiresInputConsistent({ provider, state, method }: NewPaymentFields) {
  if (provider !== "pagarme") return false;

  return state === AWAITING_INPUT_STATE || method === "" || method === undefined || isPaymentMethod(method);
}

function isFlowConsistent(fields: NewPaymentFields) {
  if (fields.flow === "redirect") return isRedirectConsistent(fields);
  if (fields.flow === "requires_payment_input") return isRequiresInputConsistent(fields);

  return isPaymentMethod(fields.method);
}

function readNewPayment(record: Record<string, unknown>): PlaceOrderPaymentResult | null {
  const { provider, flow, paymentAttemptId } = record;

  if (!isProvider(provider) || !isFlow(flow) || !isPositiveInteger(paymentAttemptId)) return null;

  const state = typeof record.state === "string" ? record.state : "";
  const fields: NewPaymentFields = { provider, flow, paymentAttemptId, state, method: record.method, redirectUrl: record.redirectUrl };

  if (!isFlowConsistent(fields)) return null;

  return {
    ...(record as Omit<PlaceOrderPaymentResult, "state">),
    method: isPaymentMethod(record.method) ? record.method : undefined,
    state,
    provider,
    flow,
    paymentAttemptId,
    configurationVersion: typeof record.configurationVersion === "string" ? record.configurationVersion : "",
    fallbackReason: typeof record.fallbackReason === "string" ? record.fallbackReason : "",
    redirectUrl: isAllowedMercadoPagoUrl(record.redirectUrl) ? record.redirectUrl : undefined,
  };
}

/**
 * Lê o pagamento devolvido pelo place-order ou pela continuação. Resposta legada (sem `flow`
 * nem `provider`) passa como sempre passou; resposta nova só é aceita coerente — redirect
 * pendente exige URL HTTPS do Mercado Pago, coleta exige tentativa — e qualquer desvio vira `null`.
 */
export function parsePlaceOrderPayment(value: unknown): PlaceOrderPaymentResult | null {
  if (!isRecord(value)) return null;

  if (value.flow === undefined && value.provider === undefined) {
    return value as PlaceOrderPaymentResult;
  }

  return readNewPayment(value);
}
