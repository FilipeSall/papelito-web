import type {
  CouponApplyCartItem,
  CouponApplyResult,
  CouponDiscountType,
} from "../types/coupon";

type WpApplyResponse = {
  ok?: boolean;
  code?: string;
  discount_type?: CouponDiscountType | string;
  free_shipping?: boolean;
  discount_value?: number;
  applied_product_ids?: number[];
  applied?: boolean;
  message?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  papelito_coupon_missing_code: "Informe um cupom.",
  papelito_coupon_not_found: "Cupom inválido ou inexistente.",
  papelito_coupon_expired: "Este cupom expirou.",
  papelito_coupon_role_restricted: "Este cupom é exclusivo para consumidores finais.",
  papelito_coupon_usage_limit_total: "Este cupom atingiu o limite total de uso.",
  papelito_coupon_usage_limit_user: "Você já utilizou este cupom o número máximo de vezes.",
  papelito_coupon_vendor_restricted: "Este cupom não pode ser aplicado a itens de outro vendor.",
  papelito_coupon_product_restricted:
    "Este cupom não pode ser aplicado aos produtos atuais do carrinho.",
  papelito_coupon_no_eligible_items: "Nenhum item do seu carrinho é elegível para este cupom.",
  papelito_coupon_minimum_not_met: "Subtotal mínimo não atingido para este cupom.",
  papelito_coupon_invalid_type: "Tipo de desconto não suportado.",
  papelito_coupon_auth_required: "Faça login para aplicar cupons.",
};

function friendlyMessage(code: string | undefined, serverMessage: string | undefined): string {
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (serverMessage && serverMessage.length > 0) return serverMessage;
  return "Não foi possível aplicar o cupom.";
}

export async function applyCouponClient(
  code: string,
  cartItems: CouponApplyCartItem[],
): Promise<CouponApplyResult> {
  const payload = {
    code,
    cart_items: cartItems.map((item) => ({
      product_id: item.productId,
      vendor_id: item.vendorId,
      qty: item.qty,
      price: item.price,
      promotion_context: item.promotionContext,
    })),
  };

  let response: Response;
  try {
    response = await fetch("/api/coupons/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      errorCode: "papelito_network_error",
      message: "Falha de rede ao aplicar cupom.",
    };
  }

  const text = await response.text();
  let parsed: WpApplyResponse = {};

  if (text) {
    try {
      parsed = JSON.parse(text) as WpApplyResponse;
    } catch {
      return {
        ok: false,
        status: response.status,
        errorCode: "papelito_invalid_response",
        message: "Resposta inválida ao aplicar cupom.",
      };
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      errorCode: typeof parsed.code === "string" ? parsed.code : "papelito_unknown",
      message: friendlyMessage(parsed.code, parsed.message),
    };
  }

  const discountType = parsed.discount_type === "fixed_cart" ? "fixed_cart" : "percent";
  const freeShipping = parsed.free_shipping === true;

  const result: CouponApplyResult = {
    ok: true,
    code: typeof parsed.code === "string" ? parsed.code : code.toUpperCase(),
    discountType,
    discountValue: typeof parsed.discount_value === "number" ? parsed.discount_value : 0,
    freeShipping,
    appliedProductIds: Array.isArray(parsed.applied_product_ids)
      ? parsed.applied_product_ids.filter((id): id is number => Number.isInteger(id) && id > 0)
      : [],
  };

  if (typeof parsed.applied === "boolean") result.applied = parsed.applied;
  if (typeof parsed.message === "string" && parsed.message.length > 0) {
    result.message = parsed.message;
  }

  return result;
}
