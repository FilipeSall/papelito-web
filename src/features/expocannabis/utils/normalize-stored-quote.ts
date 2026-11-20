import type { EventQuote, QuoteShipping } from "../types/quote";

type StoredShipping = Pick<QuoteShipping, "optionKey" | "name" | "priceCents"> & Partial<QuoteShipping>;

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function derivedDiscount(quote: EventQuote, priceCents: number): number {
  const discount = quote.itemsCents + priceCents - quote.totalCents;
  return Math.max(0, Math.min(priceCents, finiteOr(discount, 0)));
}

/**
 * Completa o frete de uma cotação restaurada do `localStorage`, que pode ter sido salva antes de o
 * frete trazer desconto, contingência e caixas. O desconto sai do próprio total salvo, que já vinha
 * abatido; sem isso o tablet mostraria frete cobrado como grátis.
 */
export function normalizeStoredQuote(quote: EventQuote | null | undefined): EventQuote | null {
  if (!quote?.shipping) return quote ?? null;
  const shipping = quote.shipping as StoredShipping;

  return {
    ...quote,
    shipping: {
      ...shipping,
      discountCents: finiteOr(shipping.discountCents, derivedDiscount(quote, shipping.priceCents)),
      deliveryTime: shipping.deliveryTime ?? null,
      waived: shipping.waived === true,
      volumes: finiteOr(shipping.volumes, 0),
    },
  };
}
