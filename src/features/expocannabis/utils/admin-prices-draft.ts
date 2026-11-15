import type { ExpoPriceProduct, ExpoPricesPublishPayload, ExpoPricesSnapshot } from "../types/admin-prices";

const KIT_PCT_OFF_MAX = 50;
const PRICE_MAX_CENTS = 10_000_000;
const THOUSANDS_ONLY = /^\d{1,3}(\.\d{3})+$/;
const DECIMAL = /^\d+(\.\d{1,2})?$/;

/** Texto que o admin digitou: o preço de cada produto e o desconto do kit, ainda sem validar. */
export type ExpoPricesDraft = {
  prices: Record<number, string>;
  kitPctOff: string;
};

/** Leitura de um campo de preço: vazio (usa o site), valor em centavos ou texto inválido. */
export type MoneyInput = { kind: "empty" } | { kind: "valid"; cents: number } | { kind: "invalid" };

/** Formata centavos para o campo de preço (`89,90`), sem símbolo de moeda. */
export function formatMoneyInput(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizeMoney(text: string): string {
  if (text.includes(",")) return text.replaceAll(".", "").replace(",", ".");
  if (THOUSANDS_ONLY.test(text)) return text.replaceAll(".", "");
  return text;
}

/**
 * Lê o preço digitado em reais. Aceita `89,90`, `89.90`, `1.234,56` e `89`; acima de
 * R$ 100.000,00 ou zero é inválido, como no WordPress.
 */
export function parseMoneyInput(raw: string): MoneyInput {
  const text = raw.replaceAll(/\s|R\$/g, "");
  if (text === "") return { kind: "empty" };

  const normalized = normalizeMoney(text);
  if (!DECIMAL.test(normalized)) return { kind: "invalid" };
  const cents = Math.round(Number(normalized) * 100);

  return cents > 0 && cents <= PRICE_MAX_CENTS ? { kind: "valid", cents } : { kind: "invalid" };
}

/** Lê o desconto do kit: inteiro de 0 a 50, ou `null` quando inválido. */
export function parseKitPctOff(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d{1,2}$/.test(text)) return null;
  const pct = Number(text);
  return pct <= KIT_PCT_OFF_MAX ? pct : null;
}

/** Rascunho igual ao que está publicado no snapshot. */
export function draftFromSnapshot(snapshot: ExpoPricesSnapshot): ExpoPricesDraft {
  const prices: Record<number, string> = {};

  for (const product of snapshot.products) {
    prices[product.id] = product.eventCents === null ? "" : formatMoneyInput(product.eventCents);
  }

  return { prices, kitPctOff: String(snapshot.kit.pctOff) };
}

/**
 * Preço próprio que o rascunho define para o produto: `null` quando o campo está vazio ou igual
 * ao preço do site, e o publicado quando o texto ainda é inválido (a tela mostra o erro à parte).
 */
export function draftEventCents(product: ExpoPriceProduct, draft: ExpoPricesDraft): number | null {
  const input = parseMoneyInput(draft.prices[product.id] ?? "");
  if (input.kind === "invalid") return product.eventCents;
  if (input.kind === "empty" || input.cents === product.sitePriceCents) return null;
  return input.cents;
}

/** Preço que o estande cobra pelo produto com o rascunho atual. */
export function draftStandCents(product: ExpoPriceProduct, draft: ExpoPricesDraft): number {
  return draftEventCents(product, draft) ?? product.sitePriceCents;
}

/** Produtos cujo campo de preço tem texto que não vira preço. */
export function invalidPriceIds(snapshot: ExpoPricesSnapshot, draft: ExpoPricesDraft): number[] {
  return snapshot.products
    .filter((product) => parseMoneyInput(draft.prices[product.id] ?? "").kind === "invalid")
    .map((product) => product.id);
}

/** Produtos cujo preço próprio no rascunho difere do publicado. */
export function changedPriceIds(snapshot: ExpoPricesSnapshot, draft: ExpoPricesDraft): number[] {
  return snapshot.products
    .filter((product) => parseMoneyInput(draft.prices[product.id] ?? "").kind !== "invalid")
    .filter((product) => draftEventCents(product, draft) !== product.eventCents)
    .map((product) => product.id);
}

/** Quantas alterações o rascunho tem: preços mudados mais o desconto do kit, se mudou. */
export function draftChangeCount(snapshot: ExpoPricesSnapshot, draft: ExpoPricesDraft): number {
  const kitChanged = parseKitPctOff(draft.kitPctOff) !== snapshot.kit.pctOff;
  return changedPriceIds(snapshot, draft).length + (kitChanged ? 1 : 0);
}

/**
 * Preço do Kit Premium com o rascunho: soma dos 4 produtos no preço do estande, cada um com o
 * desconto do kit e arredondado no centavo, igual ao WordPress. `null` quando o kit não está
 * completo no catálogo ou o desconto é inválido.
 */
export function draftKitUnitCents(snapshot: ExpoPricesSnapshot, draft: ExpoPricesDraft): number | null {
  const pctOff = parseKitPctOff(draft.kitPctOff);
  const components = snapshot.products.filter((product) => snapshot.kit.productIds.includes(product.id));
  if (pctOff === null || !snapshot.kit.available || components.length !== snapshot.kit.productIds.length) return null;

  const kept = 100 - pctOff;
  return components.reduce((sum, product) => sum + Math.floor((draftStandCents(product, draft) * kept + 50) / 100), 0);
}

/**
 * Corpo da publicação, ou `null` quando algum campo está inválido. Leva todos os preços próprios
 * que ficam, não só os alterados: o WordPress substitui o conjunto inteiro.
 */
export function buildPublishPayload(snapshot: ExpoPricesSnapshot, draft: ExpoPricesDraft): ExpoPricesPublishPayload | null {
  const kitPctOff = parseKitPctOff(draft.kitPctOff);
  if (kitPctOff === null || invalidPriceIds(snapshot, draft).length > 0) return null;

  const prices: Record<string, number> = {};
  for (const product of snapshot.products) {
    const cents = draftEventCents(product, draft);
    if (cents !== null) prices[String(product.id)] = cents;
  }

  return { version: snapshot.version, prices, kitPctOff };
}
