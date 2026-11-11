import type { EventContext, EventKit, EventLevel, EventLevelKey, EventProduct } from "../types/context";
import { every, hasNull, int, ints, isRecord, str } from "./parse-helpers";

const LEVEL_KEYS: readonly EventLevelKey[] = ["lojista", "parceiro", "pdv_perfeito", "lenda"];

/** Nível do contexto ou da cotação, ou `null` quando malformado. */
export function parseLevel(value: unknown): EventLevel | null {
  if (!isRecord(value)) return null;
  const key = LEVEL_KEYS.find((item) => item === value.key);
  const name = str(value.name);
  const minUnits = int(value.minUnits);
  const pctBp = int(value.pctBp);
  if (!key || name === null || minUnits === null || pctBp === null) return null;
  return { key, name, minUnits, pctBp };
}

function parseNamed(value: unknown): { slug: string; name: string } | null {
  if (!isRecord(value)) return null;
  const slug = str(value.slug);
  const name = str(value.name);
  return slug === null || name === null ? null : { slug, name };
}

function parseSpec(value: unknown): { label: string; value: string } | null {
  if (!isRecord(value)) return null;
  const label = str(value.label);
  const text = str(value.value);
  return label === null || text === null ? null : { label, value: text };
}

function parseProduct(value: unknown): EventProduct | null {
  if (!isRecord(value)) return null;
  const product = {
    id: int(value.id),
    name: str(value.name),
    slug: str(value.slug),
    imageUrl: str(value.imageUrl),
    priceCents: int(value.priceCents),
    stock: int(value.stock),
    category: parseNamed(value.category),
    description: str(value.description),
    specs: every(value.specs, parseSpec),
    totalSales: int(value.totalSales),
    createdAt: str(value.createdAt),
  };
  return hasNull(Object.values(product)) ? null : (product as EventProduct);
}

function parseKit(value: unknown): EventKit | null {
  if (!isRecord(value) || typeof value.available !== "boolean") return null;
  const kit = {
    productIds: ints(value.productIds),
    unitCents: int(value.unitCents),
    fullUnitCents: int(value.fullUnitCents),
    available: value.available,
  };
  return hasNull(Object.values(kit)) ? null : (kit as EventKit);
}

function parseShelves(value: unknown): EventContext["shelves"] | null {
  if (!isRecord(value)) return null;
  const shelves = { maisVendidos: ints(value.mais_vendidos), premium: ints(value.premium), lancamentos: ints(value.lancamentos) };
  return hasNull(Object.values(shelves)) ? null : (shelves as EventContext["shelves"]);
}

function parseEvent(value: unknown): EventContext["event"] | null {
  if (!isRecord(value)) return null;
  const event = { id: str(value.id), name: str(value.name), startsAt: str(value.startsAt), endsAt: str(value.endsAt) };
  return hasNull(Object.values(event)) ? null : (event as EventContext["event"]);
}

function parseOperator(value: unknown): EventContext["operator"] | null {
  if (!isRecord(value) || typeof value.canSupervise !== "boolean") return null;
  const name = str(value.name);
  return name === null ? null : { name, canSupervise: value.canSupervise };
}

/** Contexto do evento vindo do WordPress, ou `null` se qualquer campo obrigatório faltar. */
export function parseEventContext(data: unknown): EventContext | null {
  if (!isRecord(data)) return null;
  const ctx = {
    event: parseEvent(data.event),
    operator: parseOperator(data.operator),
    levels: every(data.levels, parseLevel),
    kit: parseKit(data.kit),
    categories: every(data.categories, parseNamed),
    products: every(data.products, parseProduct),
    shelves: parseShelves(data.shelves),
  };
  return hasNull(Object.values(ctx)) ? null : (ctx as EventContext);
}
