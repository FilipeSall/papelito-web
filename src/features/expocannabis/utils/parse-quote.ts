import type { EventQuote, QuoteLine } from "../types/quote";
import { parseLevel } from "./parse-context";
import { every, hasNull, int, isRecord, str } from "./parse-helpers";

function parseLine(value: unknown): QuoteLine | null {
  if (!isRecord(value)) return null;
  const line = {
    productId: int(value.product_id),
    qty: int(value.qty),
    unitCents: int(value.unit_cents),
    subtotalCents: int(value.subtotal_cents),
    discountCents: int(value.discount_cents),
    totalCents: int(value.total_cents),
  };
  return hasNull(Object.values(line)) ? null : (line as QuoteLine);
}

function parseKit(value: unknown): EventQuote["kit"] | null {
  if (!isRecord(value)) return null;
  const kit = {
    qty: int(value.qty),
    unitCents: int(value.unit_cents),
    fullUnitCents: int(value.full_unit_cents),
    totalCents: int(value.total_cents),
  };
  return hasNull(Object.values(kit)) ? null : (kit as EventQuote["kit"]);
}

function parseShipping(value: unknown): EventQuote["shipping"] | null {
  if (!isRecord(value)) return null;
  const optionKey = str(value.optionKey);
  const name = str(value.name);
  const priceCents = int(value.priceCents);
  if (optionKey === null || name === null || priceCents === null) return null;
  return { optionKey, name, priceCents, deliveryTime: int(value.deliveryTime) };
}

/** Cotação do WordPress, ou `null` se faltar valor ou fingerprint. */
export function parseQuote(data: unknown): EventQuote | null {
  if (!isRecord(data)) return null;
  const fingerprint = str(data.quoteFingerprint);
  const quote = {
    units: int(data.units),
    level: parseLevel(data.level),
    lines: every(data.lines, parseLine),
    kit: parseKit(data.kit),
    itemsCents: int(data.itemsCents),
    discountCents: int(data.discountCents),
    kitSavingsCents: int(data.kitSavingsCents),
    shipping: parseShipping(data.shipping),
    totalCents: int(data.totalCents),
    quoteFingerprint: fingerprint ? fingerprint : null,
  };
  return hasNull(Object.values(quote)) ? null : (quote as EventQuote);
}
