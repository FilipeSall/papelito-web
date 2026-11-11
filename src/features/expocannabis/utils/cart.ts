import type { EventLevel, EventProduct } from "../types/context";
import { unitsOf } from "./pricing-preview";

/** Carrinho do atendimento: quantidade por produto e kits. */
export type Cart = { qty: Record<number, number>; kits: number };

const KIT_MIN_UNITS = 10;

/** Formata centavos como `R$ 1.234,56`. */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

/** Aplica a regra do kit: abaixo de 10 unidades o kit sai e o chamador avisa com Desfazer. */
export function applyCartRules(next: Cart): { cart: Cart; kitRemoved: boolean } {
  if (next.kits > 0 && unitsOf(next.qty, next.kits) < KIT_MIN_UNITS) {
    return { cart: { qty: next.qty, kits: 0 }, kitRemoved: true };
  }
  return { cart: next, kitRemoved: false };
}

/** Índice do nível nas unidades do carrinho. */
export function levelIndex(levels: readonly EventLevel[], units: number): number {
  let index = 0;
  levels.forEach((level, position) => {
    if (units >= level.minUnits) index = position;
  });
  return index;
}

/** Quantidade máxima de um produto: estoque do vendor, até 999. */
export function maxQty(product: EventProduct): number {
  return Math.min(999, Math.max(0, product.stock));
}

/** Nome normalizado para a busca: sem acento e em minúsculas. */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Preço de um display com o desconto do nível, arredondado no centavo. */
export function discountedCents(priceCents: number, pctBp: number): number {
  return priceCents - Math.floor((priceCents * pctBp + 5000) / 10_000);
}
