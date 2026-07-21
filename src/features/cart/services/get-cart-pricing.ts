import type { CartItem, CartPricingQuote } from "../types/cart";

type PricingFailure = { ok: false; code: string; message: string; status: number };
type PricingSuccess = { ok: true; quote: CartPricingQuote };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isPricingLine(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isPositiveInteger(value.productId) &&
    isPositiveInteger(value.vendorId) &&
    isPositiveInteger(value.qty) &&
    isNonNegativeInteger(value.normalUnitCents) &&
    isNonNegativeInteger(value.subtotalCents) &&
    isNonNegativeInteger(value.discountCents) &&
    isNonNegativeInteger(value.totalCents) &&
    ["none", "coupon", "flash_sale"].includes(String(value.discountSource)) &&
    typeof value.promotionContext === "string"
  );
}

function isPricingCoupon(value: unknown) {
  if (value === null) return true;
  if (!isRecord(value)) return false;

  return (
    typeof value.code === "string" &&
    ["percent", "fixed_cart"].includes(String(value.discountType)) &&
    isNonNegativeInteger(value.discountValueCents) &&
    Array.isArray(value.appliedProductIds) &&
    value.appliedProductIds.every(isPositiveInteger) &&
    typeof value.applied === "boolean" &&
    (value.message === undefined || typeof value.message === "string")
  );
}

function isPricingAdjustment(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    typeof value.type === "string" &&
    typeof value.message === "string" &&
    (value.productId === undefined || isPositiveInteger(value.productId)) &&
    (value.code === undefined || typeof value.code === "string")
  );
}

function isPricingQuote(value: unknown): value is CartPricingQuote {
  if (
    !isRecord(value) ||
    !Array.isArray(value.lines) ||
    value.lines.length === 0 ||
    !value.lines.every(isPricingLine) ||
    !isPricingCoupon(value.coupon) ||
    !Array.isArray(value.adjustments) ||
    !value.adjustments.every(isPricingAdjustment) ||
    !isRecord(value.totals) ||
    !isRecord(value.paymentRestrictions)
  ) {
    return false;
  }

  const totals = value.totals;
  const restrictions = value.paymentRestrictions;

  return (
    isNonNegativeInteger(totals.subtotalCents) &&
    isNonNegativeInteger(totals.discountCents) &&
    isNonNegativeInteger(totals.itemsCents) &&
    isNonNegativeInteger(totals.shippingCents) &&
    isNonNegativeInteger(totals.totalCents) &&
    totals.itemsCents + totals.shippingCents === totals.totalCents &&
    isNonNegativeInteger(restrictions.creditCardMinimumCents) &&
    isNonNegativeInteger(restrictions.pixMinimumCents) &&
    isNonNegativeInteger(restrictions.boletoMinimumCents) &&
    isNonNegativeInteger(restrictions.installmentMinimumCents) &&
    isNonNegativeInteger(restrictions.maxInstallments)
  );
}

function quoteMatchesItems(quote: CartPricingQuote, items: CartItem[]) {
  if (quote.lines.length !== items.length) return false;

  const expectedIds = new Set(
    items.map((item) => Number.parseInt(item.id, 10)),
  );
  const receivedIds = new Set(quote.lines.map((line) => line.productId));

  return (
    expectedIds.size === items.length &&
    receivedIds.size === quote.lines.length &&
    Array.from(expectedIds).every(
      (productId) => Number.isInteger(productId) && receivedIds.has(productId),
    )
  );
}

export async function getCartPricing(
  items: CartItem[],
  couponCode: string | null,
  shipping?: { destinationCep: string; selectedCode: string } | null,
): Promise<PricingSuccess | PricingFailure> {
  const requestItems = items.map((item) => ({
    product_id: Number.parseInt(item.id, 10),
    qty: item.quantity,
    vendor_id: item.vendorId,
    vendor_name: item.vendorName,
    promotion_context: item.promotionContext,
  }));

  if (requestItems.some((item) => !isPositiveInteger(item.product_id))) {
    return {
      ok: false,
      code: "papelito_checkout_invalid_items",
      message: "O carrinho contem um produto invalido.",
      status: 422,
    };
  }

  let response: Response;
  try {
    response = await fetch("/api/cart/pricing", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        items: requestItems,
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

  if (!isPricingQuote(payload) || !quoteMatchesItems(payload, items)) {
    return { ok: false, code: "papelito_invalid_response", message: "Resposta invalida ao recalcular o carrinho.", status: response.status };
  }

  return { ok: true, quote: payload };
}
