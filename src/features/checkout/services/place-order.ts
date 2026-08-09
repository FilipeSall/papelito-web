import type {
  PlaceOrderInput,
  PlaceOrderResult,
  PlaceOrderError,
  PlaceOrderResponse,
} from "../types/checkout";

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

  return "Não foi possível concluir o pedido.";
}

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
          selected_code: input.shipping.selectedCode,
          destination_cep: input.shipping.destinationCep,
        },
        payment: {
          method: input.payment.method,
          installments: input.payment.installments,
          card_token_id: input.payment.cardTokenId,
          holder_name: input.payment.holderName,
          billing_address: input.payment.billingAddress
            ? {
                zip_code: input.payment.billingAddress.zipCode,
                street: input.payment.billingAddress.street,
                number: input.payment.billingAddress.number,
                complement: input.payment.billingAddress.complement,
                neighborhood: input.payment.billingAddress.neighborhood,
                city: input.payment.billingAddress.city,
                state: input.payment.billingAddress.state,
              }
            : undefined,
        },
        coupon_code: input.couponCode ?? undefined,
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

  const payload = (await response.json().catch(() => null)) as
    | (PlaceOrderResult & PlaceOrderError)
    | null;

  if (!response.ok) {
    const error: PlaceOrderError = {
      code:
        payload && typeof payload.code === "string"
          ? payload.code
          : "papelito_checkout_failed",
      message: payload && typeof payload.message === "string" ? payload.message : "",
      status: response.status,
    };

    return {
      ok: false,
      error: {
        ...error,
        message: friendlyMessage(error),
      },
    };
  }

  if (
    !payload ||
    typeof payload.orderId !== "number" ||
    typeof payload.orderNumber !== "string" ||
    typeof payload.status !== "string" ||
    !payload.payment ||
    typeof payload.payment !== "object"
  ) {
    return {
      ok: false,
      error: {
        code: "papelito_invalid_response",
        message: "Resposta inválida ao concluir o pedido.",
        status: response.status,
      },
    };
  }

  return {
    ok: true,
    result: payload,
  };
}
