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
  papelito_checkout_seller_blocked: "Vendors nao compram pela plataforma.",
  papelito_checkout_empty_items: "Seu carrinho esta vazio.",
  papelito_checkout_invalid_items: "Os itens do carrinho ficaram invalidos.",
  papelito_checkout_invalid_address: "Revise os dados do endereco de entrega.",
  papelito_checkout_invalid_shipping: "Selecione uma opcao de frete valida.",
  papelito_checkout_shipping_stale:
    "A cotacao de frete mudou. Escolha novamente a entrega.",
  papelito_checkout_invalid_payment: "Selecione uma forma de pagamento valida.",
  papelito_checkout_mixed_vendor_not_supported:
    "O checkout atual suporta apenas um vendor por pedido.",
  papelito_checkout_vendor_not_approved:
    "O vendor selecionado nao esta apto para receber pedidos.",
  papelito_checkout_insufficient_stock:
    "Algum item ficou sem estoque suficiente para concluir o pedido.",
  papelito_checkout_payment_unavailable:
    "Checkout indisponivel ate a integracao com o Pagar.me.",
  papelito_coupon_not_found: "Cupom invalido ou inexistente.",
  papelito_coupon_expired: "Este cupom expirou.",
  papelito_coupon_vendor_restricted:
    "Este cupom nao pode ser aplicado aos itens atuais.",
  papelito_coupon_product_restricted:
    "Este cupom nao pode ser aplicado aos itens atuais.",
  papelito_coupon_minimum_not_met: "Subtotal minimo nao atingido para este cupom.",
};

function friendlyMessage(error: PlaceOrderError | null) {
  if (!error) {
    return "Nao foi possivel concluir o pedido.";
  }

  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }

  return error.message || "Nao foi possivel concluir o pedido.";
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
        items: input.items.map((item) => ({
          product_id: item.productId,
          qty: item.qty,
          vendor_id: item.vendorId,
          vendor_name: item.vendorName,
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
      message:
        payload && typeof payload.message === "string"
          ? payload.message
          : "Nao foi possivel concluir o pedido.",
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
        message: "Resposta invalida ao concluir o pedido.",
        status: response.status,
      },
    };
  }

  return {
    ok: true,
    result: payload,
  };
}
