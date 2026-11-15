import type { ExpoPriceKit, ExpoPriceProduct, ExpoPricesSnapshot, ExpoSales } from "../types/admin-prices";
import { every, hasNull, int, ints, isRecord, str } from "./parse-helpers";

function parseCategory(value: unknown): ExpoPriceProduct["category"] | null {
  if (!isRecord(value)) return null;
  const slug = str(value.slug);
  const name = str(value.name);
  return slug === null || name === null ? null : { slug, name };
}

function parseEventCents(value: unknown): number | null | undefined {
  if (value === null) return null;
  const cents = int(value);
  return cents === null ? undefined : cents;
}

function parseProduct(value: unknown): ExpoPriceProduct | null {
  if (!isRecord(value)) return null;
  const eventCents = parseEventCents(value.eventCents);
  const product = {
    id: int(value.id),
    name: str(value.name),
    imageUrl: str(value.imageUrl),
    category: parseCategory(value.category),
    sitePriceCents: int(value.sitePriceCents),
    stock: int(value.stock),
  };
  if (eventCents === undefined || hasNull(Object.values(product))) return null;
  return { ...(product as Omit<ExpoPriceProduct, "eventCents">), eventCents };
}

function parseKit(value: unknown): ExpoPriceKit | null {
  if (!isRecord(value) || typeof value.available !== "boolean") return null;
  const kit = {
    productIds: ints(value.productIds),
    unitCents: int(value.unitCents),
    fullUnitCents: int(value.fullUnitCents),
    pctOff: int(value.pctOff),
  };
  return hasNull(Object.values(kit)) ? null : { ...(kit as Omit<ExpoPriceKit, "available">), available: value.available };
}

function parseSales(value: unknown): ExpoSales | null {
  if (!isRecord(value)) return null;
  const sales = {
    orders: int(value.orders),
    units: int(value.units),
    grossCents: int(value.grossCents),
    feeCents: int(value.feeCents),
    netCents: int(value.netCents),
    pendingFeeRows: int(value.pendingFeeRows),
  };
  return hasNull(Object.values(sales)) ? null : (sales as ExpoSales);
}

/** Resposta de `event/{id}/admin/prices`, ou `null` quando algum campo veio malformado. */
export function parseExpoPricesSnapshot(value: unknown): ExpoPricesSnapshot | null {
  if (!isRecord(value)) return null;
  const snapshot = {
    products: every(value.products, parseProduct),
    kit: parseKit(value.kit),
    version: int(value.version),
    updatedAt: str(value.updatedAt),
    updatedBy: str(value.updatedBy),
    sales: parseSales(value.sales),
  };
  return hasNull(Object.values(snapshot)) ? null : (snapshot as ExpoPricesSnapshot);
}
