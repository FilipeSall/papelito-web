import type { EventContext, EventLevel } from "../types/context";

const KIT_UNITS = 4;
const KIT_PCT_KEPT = 85;
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
  level: EventLevel;
  nextLevel: EventLevel | null;
  unitsToNext: number;
  lines: PreviewLine[];
  kit: { qty: number; unitCents: number; fullUnitCents: number; totalCents: number };
  itemsCents: number;
  discountCents: number;
  kitSavingsCents: number;
};

/** Preço do kit: os 4 produtos com −15%, cada um arredondado no centavo. */
export function kitUnitCents(componentPriceCents: readonly number[]): number {
  return componentPriceCents.reduce((sum, price) => sum + Math.floor((price * KIT_PCT_KEPT + 50) / 100), 0);
}

/** Unidades do pedido: displays mais 4 por kit. */
export function unitsOf(qty: Readonly<Record<number, number>>, kits: number): number {
  return Object.values(qty).reduce((sum, value) => sum + value, 0) + kits * KIT_UNITS;
}

/** Maior nível cujo mínimo de unidades o pedido atinge. */
export function levelFor(levels: readonly EventLevel[], units: number): EventLevel {
  return levels.reduce((current, level) => (units >= level.minUnits ? level : current), levels[0]);
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
  const level = levelFor(ctx.levels, units);
  const nextLevel = ctx.levels.find((item) => item.minUnits > units) ?? null;
  const lines = known.map(([id, value]) => previewLine(id, value, prices.get(id) ?? 0, level.pctBp));
  const kit = {
    qty: kits,
    unitCents: ctx.kit.unitCents,
    fullUnitCents: ctx.kit.fullUnitCents,
    totalCents: kits * ctx.kit.unitCents,
  };

  return {
    units,
    level,
    nextLevel,
    unitsToNext: nextLevel ? nextLevel.minUnits - units : 0,
    lines,
    kit,
    itemsCents: lines.reduce((sum, line) => sum + line.totalCents, 0) + kit.totalCents,
    discountCents: lines.reduce((sum, line) => sum + line.discountCents, 0),
    kitSavingsCents: kits * (ctx.kit.fullUnitCents - ctx.kit.unitCents),
  };
}
