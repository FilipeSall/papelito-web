import type { EventContext, EventLevel, EventProduct } from "../types/context";
import { baseCentsOf, firstDiscountCents } from "./pricing-preview";

/** Carrinho do atendimento: quantidade por produto e kits. */
export type Cart = { qty: Record<number, number>; kits: number };

/**
 * Formata centavos como `R$ 1.234,56`.
 *
 * O Intl separa o símbolo com espaço fino inquebrável, que é invisível no código e faz
 * comparação de texto falhar com as duas strings parecendo iguais na tela. Aqui ele vira
 * espaço comum.
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100).replace(/[  ]/g, " ");
}

/**
 * Aplica a regra do kit: abaixo do valor que o libera o kit sai e o chamador avisa com Desfazer.
 * O próprio kit conta nessa base, como no plugin.
 */
export function applyCartRules(ctx: EventContext, next: Cart): { cart: Cart; kitRemoved: boolean } {
  if (next.kits > 0 && baseCentsOf(ctx, next.qty, next.kits) < firstDiscountCents(ctx.levels)) {
    return { cart: { qty: next.qty, kits: 0 }, kitRemoved: true };
  }
  return { cart: next, kitRemoved: false };
}

/** Índice do nível no valor do carrinho. */
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
