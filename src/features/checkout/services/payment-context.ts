import type { PaymentContext } from "@/features/vendor-payment-gateways/types/payment-gateways";
import { parsePaymentContext } from "@/features/vendor-payment-gateways/utils/parse-payment-gateways";
import { gatewayErrorMessage } from "@/features/vendor-payment-gateways/utils/payment-gateway-messages";

import type { PlaceOrderError, PlaceOrderInput } from "../types/checkout";
import { readCheckoutError } from "./place-order";

/** Carrinho e empresa ativa usados para resolver o gateway antes de mostrar os meios. */
export type PaymentContextInput = {
  expectedCompanyId?: number;
  items: PlaceOrderInput["items"];
};

export type PaymentContextResponse =
  | { ok: true; context: PaymentContext }
  | { ok: false; error: PlaceOrderError };

const GATEWAY_ERROR_PREFIX = "papelito_payment_";

function contextError(payload: unknown, status: number): PlaceOrderError {
  const error = readCheckoutError(payload, status);

  if (error.code.startsWith(GATEWAY_ERROR_PREFIX)) {
    return { ...error, message: gatewayErrorMessage(error.code) };
  }

  return error;
}

/**
 * Pergunta ao backend qual gateway e fluxo valem para o carrinho, sem criar pedido nem cobrar.
 * O vendor é resolvido no WordPress; aqui só vão os itens. Contexto incoerente, erro ou falha de
 * rede nunca viram um gateway presumido — a tela bloqueia o pagamento até haver resposta válida.
 */
export async function getPaymentContext(input: PaymentContextInput): Promise<PaymentContextResponse> {
  let response: Response;

  try {
    response = await fetch("/api/checkout/payment-context", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        expected_company_id: input.expectedCompanyId,
        items: input.items.map((item) => ({
          product_id: item.productId,
          qty: item.qty,
          vendor_id: item.vendorId,
          vendor_name: item.vendorName,
        })),
      }),
    });
  } catch {
    return {
      ok: false,
      error: { code: "papelito_network_error", message: "Falha de rede ao carregar as formas de pagamento.", status: 0 },
    };
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return { ok: false, error: contextError(payload, response.status) };
  }

  const context = parsePaymentContext(payload);

  if (!context) {
    return {
      ok: false,
      error: { code: "papelito_invalid_response", message: "Não foi possível carregar as formas de pagamento.", status: response.status },
    };
  }

  return { ok: true, context };
}
