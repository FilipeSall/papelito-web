import type { EventContext, EventLevel } from "../types/context";
import { DEFAULT_KIT_PCT_OFF } from "./kit-discount";

const KIT_UNITS = 4;
const BASIS_POINTS = 10_000;

/** Linha avulsa da prévia, com o desconto do nível. */
export type PreviewLine = {
  productId: number;
  qty: number;
  unitCents: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
};

/** Prévia do pedido no tablet. Só exibe; o valor cobrado é o da cotação do servidor. */
export type PricingPreview = {
  units: number;
  /** Valor do pedido antes do desconto e antes do frete; é ele que escolhe a faixa. */
  baseCents: number;
  level: EventLevel;
  nextLevel: EventLevel | null;
  centsToNext: number;
  lines: PreviewLine[];
  kit: { qty: number; unitCents: number; fullUnitCents: number; totalCents: number };
  itemsCents: number;
  discountCents: number;
  kitSavingsCents: number;
};

/** Preço do kit: os 4 produtos com o desconto do kit (−15% por padrão), cada um arredondado no centavo. */
export function kitUnitCents(componentPriceCents: readonly number[], pctOff: number = DEFAULT_KIT_PCT_OFF): number {
  const kept = 100 - pctOff;
  return componentPriceCents.reduce((sum, price) => sum + Math.floor((price * kept + 50) / 100), 0);
}

/** Unidades do pedido: displays mais 4 por kit. */
export function unitsOf(qty: Readonly<Record<number, number>>, kits: number): number {
  return Object.values(qty).reduce((sum, value) => sum + value, 0) + kits * KIT_UNITS;
}

/**
 * Base da faixa: avulsos pelo preço do estande mais os kits pelo preço cheio, antes de qualquer
 * desconto e antes do frete. Espelha `papelito_event_sales_base_cents()` do plugin; se as duas
 * contas divergirem, a tela promete uma faixa que a cobrança não dá.
 */
export function baseCentsOf(ctx: EventContext, qty: Readonly<Record<number, number>>, kits: number): number {
  const prices = new Map(ctx.products.map((product) => [product.id, product.priceCents]));
  const loose = Object.entries(qty).reduce((sum, [id, value]) => sum + (value > 0 ? value * (prices.get(Number(id)) ?? 0) : 0), 0);
  return loose + kits * ctx.kit.fullUnitCents;
}

/** Maior nível cujo mínimo em centavos a base do pedido atinge. */
export function levelFor(levels: readonly EventLevel[], baseCents: number): EventLevel {
  return levels.reduce((current, level) => (baseCents >= level.minCents ? level : current), levels[0]);
}

/**
 * Valor a partir do qual o Kit Premium e o brinde entram: o primeiro degrau com desconto.
 * Derivado da escada publicada, como no plugin, para os dois não descolarem.
 */
export function firstDiscountCents(levels: readonly EventLevel[]): number {
  return levels.find((level) => level.pctBp > 0)?.minCents ?? Number.MAX_SAFE_INTEGER;
}

function previewLine(productId: number, qty: number, unitCents: number, pctBp: number): PreviewLine {
  const subtotalCents = qty * unitCents;
  const discountCents = Math.floor((subtotalCents * pctBp + BASIS_POINTS / 2) / BASIS_POINTS);
  return { productId, qty, unitCents, subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}

/**
 * Espelho da conta do servidor para a tela: nível, desconto por linha e Kit Premium.
 *
 * Produto que não está no contexto e quantidade zero ficam fora.
 */
export function previewPricing(ctx: EventContext, qty: Readonly<Record<number, number>>, kits: number): PricingPreview {
  const prices = new Map(ctx.products.map((product) => [product.id, product.priceCents]));
  const known = Object.entries(qty)
    .map(([id, value]) => [Number(id), value] as const)
    .filter(([id, value]) => value > 0 && prices.has(id));
  const units = known.reduce((sum, [, value]) => sum + value, 0) + kits * KIT_UNITS;
  const baseCents = baseCentsOf(ctx, qty, kits);
  const level = levelFor(ctx.levels, baseCents);
  const nextLevel = ctx.levels.find((item) => item.minCents > baseCents) ?? null;
  const lines = known.map(([id, value]) => previewLine(id, value, prices.get(id) ?? 0, level.pctBp));
  const kit = {
    qty: kits,
    unitCents: ctx.kit.unitCents,
    fullUnitCents: ctx.kit.fullUnitCents,
    totalCents: kits * ctx.kit.unitCents,
  };

  return {
    units,
    baseCents,
    level,
    nextLevel,
    centsToNext: nextLevel ? nextLevel.minCents - baseCents : 0,
    lines,
    kit,
    itemsCents: lines.reduce((sum, line) => sum + line.totalCents, 0) + kit.totalCents,
    discountCents: lines.reduce((sum, line) => sum + line.discountCents, 0),
    kitSavingsCents: kits * (ctx.kit.fullUnitCents - ctx.kit.unitCents),
  };
}
