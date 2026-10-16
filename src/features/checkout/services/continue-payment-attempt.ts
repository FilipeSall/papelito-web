import type {
  ContinuePaymentResponse,
  PlaceOrderPaymentInput,
} from "../types/checkout";
import { parsePlaceOrderPayment } from "../utils/parse-place-order-payment";
import { readCheckoutError, serializePaymentInput } from "./place-order";

/** Tentativa aguardando coleta e os dados Pagar.me recém-tokenizados para ela. */
export type ContinuePaymentInput = {
  paymentAttemptId: number;
  expectedCompanyId?: number;
  configurationVersion: string;
  payment: PlaceOrderPaymentInput;
};

function invalidResponse(status: number): ContinuePaymentResponse {
  return {
    ok: false,
    error: { code: "papelito_invalid_response", message: "Resposta inválida ao concluir o pagamento.", status },
  };
}

/**
 * Completa o pagamento Pagar.me da MESMA tentativa e pedido (nunca abre outro checkout). Retry
 * devolve o resultado já emitido; configuração obsoleta volta como erro sem cobrar. A resposta é
 * a do WordPress (`order_id`, `payment`), validada como o place-order antes de virar sucesso.
 */
export async function continuePaymentAttempt(input: ContinuePaymentInput): Promise<ContinuePaymentResponse> {
  let response: Response;

  try {
    response = await fetch(`/api/checkout/payment-attempts/${input.paymentAttemptId}/continue`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        expectedCompanyId: input.expectedCompanyId,
        configurationVersion: input.configurationVersion,
        payment: serializePaymentInput(input.payment),
      }),
    });
  } catch {
    return {
      ok: false,
      error: { code: "papelito_network_error", message: "Falha de rede ao concluir o pagamento. Tente de novo.", status: 0 },
    };
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return { ok: false, error: readCheckoutError(payload, response.status) };
  }

  const record = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const payment = parsePlaceOrderPayment(record.payment);

  if (typeof record.order_id !== "number" || record.order_id <= 0 || !payment) {
    return invalidResponse(response.status);
  }

  return {
    ok: true,
    result: {
      orderId: record.order_id,
      orderNumber: typeof record.order_number === "string" ? record.order_number : String(record.order_id),
      status: typeof record.status === "string" ? record.status : "",
      payment,
    },
  };
}
