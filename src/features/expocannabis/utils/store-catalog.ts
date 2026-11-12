import type { EventContext, EventProduct } from "../types/context";
import { normalizeSearch } from "./cart";

/** Categoria da loja: vitrine inicial, especiais ou uma categoria do catálogo. */
export type StoreCategory = { key: string; label: string; imageUrl?: string };

/** Selo de destaque do card: linha Premium ou lançamento. */
export type ProductTag = "Premium" | "Novo";

export const HOME = "inicio";
export const ALL = "todos";
export const PREMIUM = "premium";
export const LAUNCHES = "lancamentos";

function imageOf(products: Map<number, EventProduct>, ids: number[]): string | undefined {
  return ids.map((id) => products.get(id)?.imageUrl).find(Boolean);
}

/** Produtos do contexto na ordem dos ids, ignorando ids que não estão no catálogo. */
export function pickProducts(products: Map<number, EventProduct>, ids: number[]): EventProduct[] {
  return ids.map((id) => products.get(id)).filter((product): product is EventProduct => product !== undefined);
}

/** Início, categorias do catálogo e, no fim, Premium e Lançamentos, cada uma com a foto de um produto dela. */
export function buildStoreCategories(context: EventContext): StoreCategory[] {
  const byId = new Map(context.products.map((product) => [product.id, product]));
  const catalog = context.categories.map((category) => ({
    key: `cat:${category.slug}`,
    label: category.name,
    imageUrl: context.products.find((product) => product.category.slug === category.slug && product.imageUrl)?.imageUrl,
  }));
  return [
    { key: HOME, label: "Início" },
    ...catalog,
    { key: PREMIUM, label: "Premium", imageUrl: imageOf(byId, [...context.kit.productIds].reverse()) },
    { key: LAUNCHES, label: "Lançamentos", imageUrl: imageOf(byId, context.shelves.lancamentos) },
  ];
}

/** Selo de cada produto: Premium (kit) vale mais que Novo (lançamentos). */
export function buildProductTags(context: EventContext): Map<number, ProductTag> {
  const tags = new Map<number, ProductTag>();
  context.shelves.lancamentos.forEach((id) => tags.set(id, "Novo"));
  context.kit.productIds.forEach((id) => tags.set(id, "Premium"));
  return tags;
}

/** Produtos da grade: busca vence a categoria; "todos" mostra o catálogo inteiro. */
export function gridProducts(context: EventContext, byId: Map<number, EventProduct>, category: string, search: string): EventProduct[] {
  const term = normalizeSearch(search);
  if (term) return context.products.filter((product) => normalizeSearch(product.name).includes(term));
  if (category === ALL) return context.products;
  if (category === PREMIUM) return pickProducts(byId, context.kit.productIds);
  if (category === LAUNCHES) return pickProducts(byId, context.shelves.lancamentos);
  return context.products.filter((product) => `cat:${product.category.slug}` === category);
}

/** Título da grade: resultados da busca, "Todos os produtos", "Linha Premium" ou o nome da categoria. */
export function gridTitle(categories: StoreCategory[], category: string, search: string): string {
  if (normalizeSearch(search)) return `Resultados pra "${search.trim()}"`;
  if (category === ALL) return "Todos os produtos";
  if (category === PREMIUM) return "Linha Premium";
  return categories.find((item) => item.key === category)?.label ?? "Produtos";
}

/** "N produtos" (ou "1 produto") do cabeçalho da grade. */
export function productCountText(count: number): string {
  return `${count} ${count === 1 ? "produto" : "produtos"}`;
}

/** Linha secundária do card: o último item da ficha ("rótulo: valor") ou, sem ficha, a categoria. */
export function secondaryLine(product: EventProduct): string {
  const last = product.specs[product.specs.length - 1];
  return last ? `${last.label}: ${last.value}` : product.category.name;
}
