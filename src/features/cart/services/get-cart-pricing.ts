import type { CartItem, CartPricingQuote } from "../types/cart";

type PricingFailure = { ok: false; code: string; message: string; status: number };
type PricingSuccess = { ok: true; quote: CartPricingQuote };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPricingQuote(value: unknown): value is CartPricingQuote {
  if (!isRecord(value) || !Array.isArray(value.lines) || !isRecord(value.totals)) return false;
  return (
    typeof value.totals.subtotalCents === "number" &&
    typeof value.totals.discountCents === "number" &&
    typeof value.totals.itemsCents === "number" &&
    typeof value.totals.totalCents === "number" &&
    Array.isArray(value.adjustments) &&
    isRecord(value.paymentRestrictions)
  );
}

export async function getCartPricing(
  items: CartItem[],
  couponCode: string | null,
  shipping?: { destinationCep: string; selectedCode: string } | null,
): Promise<PricingSuccess | PricingFailure> {
  let response: Response;
  try {
    response = await fetch("/api/cart/pricing", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          product_id: Number.parseInt(item.id, 10),
          qty: item.quantity,
          vendor_id: item.vendorId,
          vendor_name: item.vendorName,
          promotion_context: item.promotionContext,
        })),
        coupon_code: couponCode || undefined,
        shipping: shipping
          ? {
              destination_cep: shipping.destinationCep,
              selected_code: shipping.selectedCode,
            }
          : undefined,
      }),
    });
  } catch {
    return { ok: false, code: "papelito_network_error", message: "Falha de rede ao recalcular o carrinho.", status: 0 };
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const error = isRecord(payload) ? payload : {};
    return {
      ok: false,
      code: typeof error.code === "string" ? error.code : "papelito_pricing_failed",
      message: typeof error.message === "string" ? error.message : "Nao foi possivel recalcular o carrinho.",
      status: response.status,
    };
  }

  if (!isPricingQuote(payload)) {
    return { ok: false, code: "papelito_invalid_response", message: "Resposta invalida ao recalcular o carrinho.", status: response.status };
  }

  return { ok: true, quote: payload };
}
