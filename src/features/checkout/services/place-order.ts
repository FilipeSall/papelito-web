import { gatewayErrorMessage } from "@/features/vendor-payment-gateways/utils/payment-gateway-messages";

import type {
  PlaceOrderInput,
  PlaceOrderError,
  PlaceOrderPaymentInput,
  PlaceOrderResult,
  PlaceOrderResponse,
} from "../types/checkout";
import { parsePlaceOrderPayment } from "../utils/parse-place-order-payment";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function hasValidTotals(value: unknown): boolean {
  if (!isRecord(value)) return false;

  return (
    isNonNegativeInteger(value.subtotalCents) &&
    isNonNegativeInteger(value.discountCents) &&
    isNonNegativeInteger(value.itemsCents) &&
    isNonNegativeInteger(value.shippingCents) &&
    isNonNegativeInteger(value.shippingDiscountCents) &&
    isNonNegativeInteger(value.totalCents) &&
    value.shippingDiscountCents <= value.shippingCents &&
    value.itemsCents + value.shippingCents - value.shippingDiscountCents ===
      value.totalCents
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  papelito_checkout_auth_required: "Faca login para concluir o pedido.",
  papelito_checkout_customer_only:
    "Somente consumidores finais podem concluir o checkout.",
  papelito_checkout_seller_blocked: "Vendors não compram pela plataforma.",
  papelito_checkout_empty_items: "Seu carrinho está vazio.",
  papelito_checkout_invalid_items: "Os itens do carrinho ficaram inválidos.",
  papelito_checkout_invalid_address: "Revise os dados do endereço de entrega.",
  papelito_checkout_invalid_shipping: "Selecione uma opção de frete válida.",
  papelito_checkout_coverage_unavailable:
    "Não foi possível validar a cobertura de entrega. Tente novamente.",
  papelito_checkout_shipping_stale:
    "A cotação de frete mudou. Escolha novamente a entrega.",
  papelito_checkout_invalid_payment: "Selecione uma forma de pagamento válida.",
  papelito_checkout_mixed_vendor_not_supported:
    "O checkout atual suporta apenas um vendor por pedido.",
  papelito_checkout_vendor_not_approved:
    "O vendor selecionado não esta apto para receber pedidos.",
  papelito_checkout_insufficient_stock:
    "Algum item ficou sem estoque suficiente para concluir o pedido.",
  papelito_checkout_payment_unavailable:
    "Checkout indisponível até a integração com o Pagar.me.",
  papelito_checkout_amount_below_minimum:
    "O total ficou abaixo do mínimo aceito para esta forma de pagamento.",
  papelito_checkout_installment_below_minimum:
    "Reduza as parcelas; o valor mínimo configurado por parcela não foi atingido.",
  papelito_checkout_installments_exceeded:
    "A quantidade de parcelas excedeu o limite permitido.",
  papelito_checkout_too_many_items:
    "O carrinho excedeu o limite de itens permitido.",
  papelito_checkout_duplicate_item:
    "O carrinho possui produtos duplicados. Atualize a página e tente novamente.",
  papelito_checkout_attempt_in_progress:
    "Seu pedido já esta sendo processado. Aguarde alguns instantes.",
	papelito_checkout_company_context_changed:
		"A empresa ativa mudou. Revise o checkout antes de finalizar.",
	papelito_checkout_attempt_payload_conflict:
		"Esta tentativa de checkout foi reutilizada com dados diferentes. Atualize a página.",
	papelito_b2b_purchase_not_allowed:
		"Sua empresa ainda não está apta para realizar compras.",
	papelito_b2b_cnpj_alphanumeric_payment_unsupported:
		"O pagamento para CNPJ alfanumérico ainda não está disponível.",
  papelito_checkout_gateway_amount_rejected:
    "O Pagar.me rejeitou o valor da cobrança. Revise o total e as parcelas.",
  papelito_checkout_total_mismatch:
    "Os valores do pedido mudaram. Atualize o carrinho e tente novamente.",
  papelito_coupon_not_found: "Cupom inválido ou inexistente.",
  papelito_coupon_expired: "Este cupom expirou.",
  papelito_coupon_vendor_restricted:
    "Este cupom não pode ser aplicado aos itens atuais.",
  papelito_coupon_product_restricted:
    "Este cupom não pode ser aplicado aos itens atuais.",
  papelito_coupon_minimum_not_met: "Subtotal mínimo não atingido para este cupom.",
};

const GATEWAY_ERROR_PREFIX = "papelito_payment_";

function friendlyMessage(error: PlaceOrderError | null) {
  if (!error) {
    return "Não foi possível concluir o pedido.";
  }

  if (error.message) {
    return error.message;
  }

  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }

  if (error.code.startsWith(GATEWAY_ERROR_PREFIX)) {
    return gatewayErrorMessage(error.code);
  }

  return "Não foi possível concluir o pedido.";
}

/**
 * Converte o corpo de erro de uma rota de checkout em `PlaceOrderError` com mensagem
 * amigável. `orderId` só vem quando o pedido já existe (reconciliação); `configurationVersion`,
 * quando a tentativa passou a esperar outra versão.
 */
export function readCheckoutError(payload: unknown, status: number): PlaceOrderError {
  const record = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const error: PlaceOrderError = {
    code: typeof record.code === "string" ? record.code : "papelito_checkout_failed",
    message: typeof record.message === "string" ? record.message : "",
    status,
  };
  const orderId = record.orderId;

  if (typeof orderId === "number" && Number.isInteger(orderId) && orderId > 0) {
    error.orderId = orderId;
  }

  if (typeof record.configurationVersion === "string") {
    error.configurationVersion = record.configurationVersion;
  }

  return { ...error, message: friendlyMessage(error) };
}

/** Pagamento Pagar.me no formato snake_case que o WordPress espera (place-order e continuação). */
export function serializePaymentInput(payment: PlaceOrderPaymentInput) {
  return {
    method: payment.method,
    installments: payment.installments,
    card_token_id: payment.cardTokenId,
    holder_name: payment.holderName,
    billing_address: payment.billingAddress
      ? {
          zip_code: payment.billingAddress.zipCode,
          street: payment.billingAddress.street,
          number: payment.billingAddress.number,
          complement: payment.billingAddress.complement,
          neighborhood: payment.billingAddress.neighborhood,
          city: payment.billingAddress.city,
          state: payment.billingAddress.state,
        }
      : undefined,
  };
}

/** Erro devolvido quando o backend responde 2xx com corpo que não é um pedido coerente. */
export function invalidCheckoutResponse(status: number): PlaceOrderResponse {
  return {
    ok: false,
    error: {
      code: "papelito_invalid_response",
      message: "Resposta inválida ao concluir o pedido.",
      status,
    },
  };
}

/**
 * Cria o pedido pelo proxy `/api/checkout/place-order`. Sem `payment` (Mercado Pago) o backend
 * decide o modo; a resposta só vira sucesso com pedido, totais e pagamento coerentes. Retry com o
 * mesmo `checkoutAttemptId` devolve o pedido já criado, nunca um segundo.
 */
export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResponse> {
  let response: Response;

  try {
    response = await fetch("/api/checkout/place-order", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkout_attempt_id: input.checkoutAttemptId,
		expected_company_id: input.expectedCompanyId,
        items: input.items.map((item) => ({
          product_id: item.productId,
          qty: item.qty,
          vendor_id: item.vendorId,
          vendor_name: item.vendorName,
          promotion_context: item.promotionContext,
        })),
        address: {
          zip_code: input.address.zipCode,
          street: input.address.street,
          number: input.address.number,
          complement: input.address.complement,
          neighborhood: input.address.neighborhood,
          city: input.address.city,
          state: input.address.state,
        },
        shipping: {
          selected_option_key:
            input.shipping.selectedOptionKey ?? input.shipping.selectedCode,
          expected_fingerprint: input.shipping.expectedFingerprint,
          expected_customer_price_cents: input.shipping.expectedCustomerPriceCents,
          expected_delivery_time: input.shipping.expectedDeliveryTime,
          expected_expires_at: input.shipping.expectedExpiresAt,
          destination_cep: input.shipping.destinationCep,
        },
        payment: input.payment ? serializePaymentInput(input.payment) : undefined,
        coupon_code: input.couponCode ?? undefined,
        analytics:
          input.analytics?.clientId || input.analytics?.sessionId
            ? {
                client_id: input.analytics.clientId,
                session_id: input.analytics.sessionId,
              }
            : undefined,
      }),
    });
  } catch {
    return {
      ok: false,
      error: {
        code: "papelito_network_error",
        message: "Falha de rede ao concluir o pedido.",
        status: 0,
      },
    };
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return { ok: false, error: readCheckoutError(payload, response.status) };
  }

  if (typeof payload !== "object" || payload === null) {
    return invalidCheckoutResponse(response.status);
  }

  const record = payload as Record<string, unknown>;
  const payment = parsePlaceOrderPayment(record.payment);

  if (
    typeof record.orderId !== "number" ||
    typeof record.orderNumber !== "string" ||
    typeof record.status !== "string" ||
    !payment ||
    !hasValidTotals(record.totals)
  ) {
    return invalidCheckoutResponse(response.status);
  }

  return {
    ok: true,
    result: {
      ...record,
      orderId: record.orderId,
      orderNumber: record.orderNumber,
      status: record.status,
      payment,
      totals: record.totals as PlaceOrderResult["totals"],
    },
  };
}
