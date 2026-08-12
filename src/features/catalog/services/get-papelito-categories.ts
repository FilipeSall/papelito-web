import "server-only";

import { cache } from "react";

import { wpRest } from "@/lib/server/wp-rest";

export type PapelitoSubcategory = {
  facet: string;
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
};

export type PapelitoCategory = {
  description: string;
  /** Produtos publicados na categoria. Alimenta a contagem das abas. */
  productCount: number;
  iconUrl: string | null;
  id: number;
  name: string;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  sortOrder: number;
  subcategories: PapelitoSubcategory[];
};

export type PapelitoTaxonomy = {
  /**
   * `false` quando a origem não respondeu.
   *
   * Distingue "WordPress disse que não há categoria" de "não deu para perguntar" —
   * a mesma separação entre `unresolved` e `unavailable` que o catálogo já faz.
   * Sem ela, indisponibilidade viraria catálogo vazio.
   */
  available: boolean;
  categories: PapelitoCategory[];
  version: number;
};

const EMPTY_TAXONOMY: PapelitoTaxonomy = {
  available: false,
  categories: [],
  version: 0,
};

/**
 * Árvore pública de categorias da Papelito.
 *
 * Cacheável: o endpoint é público, pequeno e versionado no WordPress. A home e o
 * catálogo são ISR e não podem passar a depender de fetch `no-store`.
 */
export const getPapelitoTaxonomy = cache(async (): Promise<PapelitoTaxonomy> => {
  const result = await wpRest<{
    categories: PapelitoCategory[];
    version: number;
  }>("/papelito/v1/categories", {
    revalidate: 300,
    tags: ["wp:categories"],
  });

  if (!result.ok) {
    console.warn("[papelito-taxonomy] indisponível:", result.error.message);
    return EMPTY_TAXONOMY;
  }

  return {
    available: true,
    categories: Array.isArray(result.data.categories) ? result.data.categories : [],
    version: Number(result.data.version) || 0,
  };
});

export function findCategoryBySlug(taxonomy: PapelitoTaxonomy, slug: string) {
  return taxonomy.categories.find((category) => category.slug === slug) ?? null;
}

/**
 * Resolve slugs de subcategoria dentro de uma categoria.
 *
 * Devolve também `unresolved`, para o chamador poder ser fail-closed: slug pedido
 * que não existe tem de zerar o resultado, nunca ser ignorado.
 */
export function resolveSubcategorySlugs(
  taxonomy: PapelitoTaxonomy,
  categorySlug: string,
  slugs: string[],
) {
  if (slugs.length === 0) {
    return { resolved: [] as string[], unresolved: false };
  }

  const category = findCategoryBySlug(taxonomy, categorySlug);

  if (!category) {
    return { resolved: [] as string[], unresolved: true };
  }

  const available = new Set(category.subcategories.map((item) => item.slug));
  const resolved = slugs.filter((slug) => available.has(slug));

  return { resolved, unresolved: resolved.length !== slugs.length };
}

/**
 * Contagem por aba, a partir da taxonomia.
 *
 * A contagem usa a CATEGORIA PRINCIPAL, não a árvore: somar raiz e filho faria
 * `todos` contar o mesmo produto duas vezes. Aqui cada produto conta uma vez,
 * por construção.
 */
export function buildTabCounts(taxonomy: PapelitoTaxonomy) {
  const counts: Record<string, number> = { todos: 0 };

  for (const category of taxonomy.categories) {
    counts[category.slug] = category.productCount;
    counts.todos += category.productCount;
  }

  return counts;
}

/**
 * Valida os slugs de categoria pedidos contra a taxonomia.
 *
 * Fail-closed: slug que não existe devolve `unresolved`, e o chamador zera o
 * catálogo em vez de ignorar o filtro. Categoria renomeada não pode virar
 * "mostre tudo".
 */
export function resolveCategorySlugs(taxonomy: PapelitoTaxonomy, slugs: string[]) {
  if (slugs.length === 0) {
    return { resolved: [] as string[], unresolved: [] as string[] };
  }

  const known = new Set(taxonomy.categories.map((category) => category.slug));

  return {
    resolved: slugs.filter((slug) => known.has(slug)),
    unresolved: slugs.filter((slug) => !known.has(slug)),
  };
}
