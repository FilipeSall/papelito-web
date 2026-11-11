import type {
  BuyerInput,
  BuyerLookup,
  BuyerUpsertResult,
  CreateOrderInput,
  EventOrderStatus,
  EventPaymentMethod,
  ManualConfirmInput,
} from "../types/order";
import type { EventQuote, QuoteInput } from "../types/quote";
import { parseBuyerLookup, parseBuyerUpsert, parseOrderStatus } from "../utils/parse-order-status";
import { isRecord } from "../utils/parse-helpers";
import { parseQuote } from "../utils/parse-quote";

/** Resultado de uma chamada do tablet: dado já validado ou erro com o código do servidor. */
export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string; data?: Record<string, unknown> };

type Call<T> = {
  url: string;
  method: "GET" | "POST";
  body?: unknown;
  idempotencyKey?: string;
  parse: (data: unknown) => T | null;
};

const BASE = "/api/expocannabis";

const GENERIC_MESSAGE = "Não deu certo agora. Tenta de novo.";

function failure<T>(status: number, body: unknown): ClientResult<T> {
  const record = isRecord(body) ? body : {};
  return {
    ok: false,
    status,
    code: typeof record.code === "string" && record.code ? record.code : "papelito_unknown",
    message: typeof record.message === "string" && record.message ? record.message : GENERIC_MESSAGE,
    ...(isRecord(record.data) ? { data: record.data } : {}),
  };
}

async function call<T>({ url, method, body, idempotencyKey, parse }: Call<T>): Promise<ClientResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, code: "network_error", message: "Sem conexão com o servidor." };
  }

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return failure(response.status, json);
  }

  const data = parse(json);
  return data === null
    ? { ok: false, status: response.status, code: "papelito_invalid_response", message: GENERIC_MESSAGE }
    : { ok: true, data };
}

function orderUrl(orderId: number, action: string): string {
  return `${BASE}/orders/${orderId}/${action}`;
}

function anyRecord(data: unknown): Record<string, unknown> | null {
  return isRecord(data) ? data : null;
}

/** Chamadas do tablet às rotas `/api/expocannabis/*`. Nenhuma lança erro. */
export const expocannabisClient = {
  lookupBuyer: (cnpj: string) =>
    call<BuyerLookup>({ url: `${BASE}/buyers/lookup`, method: "POST", body: { cnpj }, parse: parseBuyerLookup }),
  upsertBuyer: (input: BuyerInput) =>
    call<BuyerUpsertResult>({ url: `${BASE}/buyers`, method: "POST", body: input, parse: parseBuyerUpsert }),
  quote: (input: QuoteInput) => call<EventQuote>({ url: `${BASE}/quote`, method: "POST", body: input, parse: parseQuote }),
  createOrder: (input: CreateOrderInput) =>
    call<EventOrderStatus>({
      url: `${BASE}/orders`,
      method: "POST",
      body: input,
      idempotencyKey: input.checkoutAttemptId,
      parse: parseOrderStatus,
    }),
  orderStatus: (orderId: number) =>
    call<EventOrderStatus>({ url: orderUrl(orderId, "status"), method: "GET", parse: parseOrderStatus }),
  cancel: (orderId: number) =>
    call<EventOrderStatus>({ url: orderUrl(orderId, "cancel"), method: "POST", body: {}, parse: parseOrderStatus }),
  retry: (orderId: number, method: EventPaymentMethod, terminalId: string) =>
    call<EventOrderStatus>({ url: orderUrl(orderId, "retry"), method: "POST", body: { method, terminalId }, parse: parseOrderStatus }),
  abandon: (orderId: number) =>
    call<Record<string, unknown>>({ url: orderUrl(orderId, "abandon"), method: "POST", body: {}, parse: anyRecord }),
  manualConfirm: (orderId: number, input: ManualConfirmInput) =>
    call<EventOrderStatus>({ url: orderUrl(orderId, "manual-confirm"), method: "POST", body: input, parse: parseOrderStatus }),
  lead: (orderId: number) =>
    call<Record<string, unknown>>({ url: orderUrl(orderId, "lead"), method: "POST", body: {}, parse: anyRecord }),
};
