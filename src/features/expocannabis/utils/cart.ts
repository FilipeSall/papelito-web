import type { EventContext, EventLevel, EventProduct } from "../types/context";
import { baseCentsOf, kitMinCents } from "./pricing-preview";

/** Carrinho do atendimento: quantidade por produto e kits. */
export type Cart = { qty: Record<number, number>; kits: number };

/** Formata centavos como `R$ 1.234,56`. */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

/** Valor redondo sem centavos (`R$ 1.000`), para os mínimos dos níveis; quebrado cai em `formatCents`. */
export function formatWholeCents(cents: number): string {
  if (cents % 100 !== 0) return formatCents(cents);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

/** Brinde do resumo: liberado em nível com desconto; antes dele, o valor que o libera. */
export function giftLabel(level: EventLevel, kitMinCents: number): string {
  return level.pctBp > 0 ? "Bandeja chaveiro + merch" : `a partir de ${formatWholeCents(kitMinCents)}`;
}

/** Aplica a regra do kit: com a base abaixo do primeiro nível com desconto o kit sai e o chamador avisa com Desfazer. */
export function applyCartRules(ctx: Pick<EventContext, "products" | "kit" | "levels">, next: Cart): { cart: Cart; kitRemoved: boolean } {
  if (next.kits > 0 && baseCentsOf(ctx, next.qty, next.kits) < kitMinCents(ctx.levels)) {
    return { cart: { qty: next.qty, kits: 0 }, kitRemoved: true };
  }
  return { cart: next, kitRemoved: false };
}

/** Índice do nível na base do carrinho, em centavos. */
export function levelIndex(levels: readonly EventLevel[], baseCents: number): number {
  let index = 0;
  levels.forEach((level, position) => {
    if (baseCents >= level.minCents) index = position;
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
