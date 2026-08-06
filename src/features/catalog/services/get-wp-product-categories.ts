import "server-only";

import { cache } from "react";
import { print } from "graphql";

import { isMockDataEnabled } from "@/lib/server/env";
import { wpGraphqlRequest } from "@/lib/server/wp-graphql";

import { CATEGORIES_QUERY } from "../queries/categories";
import type { ProductTypeId } from "../types/products-catalog";
import {
  SPECIFIC_PRODUCT_TYPES,
  normalizeTaxonomyText,
  resolveRootProductType,
  type SpecificProductTypeId,
} from "../utils/product-type-taxonomy";

export interface WpCategoryEntry {
  databaseId: number;
  parentDatabaseId: number | null;
  slug: string;
  name: string;
  count: number;
  typeId: SpecificProductTypeId | null;
}

export interface WpCategoryTaxonomy {
  available: boolean;
  entries: WpCategoryEntry[];
}

export interface CategoryFilter {
  slugs: string[];
  unresolved: SpecificProductTypeId[];
  /**
   * `false` quando a taxonomia não pôde ser consultada.
   *
   * Sem isso, `unresolved` colapsa duas causas com tratamento oposto: termo renomeado ou
   * removido com WordPress saudável é fail-closed legítimo ("nenhum produto"), enquanto
   * WPGraphQL indisponível é erro e precisa virar `sourceStatus: "unavailable"`.
   */
  available: boolean;
}

interface WpCategoryNode {
  databaseId?: number | null;
  slug?: string | null;
  name?: string | null;
  count?: number | null;
  parentDatabaseId?: number | null;
}

function resolveRootNode(
  node: WpCategoryNode,
  byId: Map<number, WpCategoryNode>,
): WpCategoryNode {
  const visited = new Set<number>();
  let current = node;

  while (typeof current.parentDatabaseId === "number" && current.parentDatabaseId > 0) {
    if (visited.has(current.parentDatabaseId)) {
      return current;
    }

    visited.add(current.parentDatabaseId);
    const parent = byId.get(current.parentDatabaseId);

    if (!parent) {
      return current;
    }

    current = parent;
  }

  return current;
}

export const getWpProductCategories = cache(async (): Promise<WpCategoryTaxonomy> => {
  if (isMockDataEnabled()) {
    return { available: false, entries: [] };
  }

  let data: {
    productCategories?: { nodes?: WpCategoryNode[] | null } | null;
  };

  try {
    data = await wpGraphqlRequest<{
      productCategories?: { nodes?: WpCategoryNode[] | null } | null;
    }>(
      print(CATEGORIES_QUERY),
      {},
      { revalidate: 300, tags: ["wp:categories"] },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[wp-categories] Falha ao consultar categorias no WPGraphQL.", message);
    return { available: false, entries: [] };
  }

  const nodes = (data.productCategories?.nodes ?? []).filter(
    (node): node is WpCategoryNode => Boolean(node?.databaseId && node?.slug),
  );

  const byId = new Map<number, WpCategoryNode>();
  for (const node of nodes) {
    byId.set(node.databaseId as number, node);
  }

  const entries = nodes.map((node) => {
    const root = resolveRootNode(node, byId);

    return {
      databaseId: node.databaseId as number,
      parentDatabaseId:
        typeof node.parentDatabaseId === "number" && node.parentDatabaseId > 0
          ? node.parentDatabaseId
          : null,
      slug: (node.slug ?? "").trim(),
      name: (node.name ?? "").trim(),
      count: typeof node.count === "number" ? node.count : 0,
      typeId: resolveRootProductType(root.name, root.slug),
    };
  });

  return { available: true, entries };
});

/**
 * Resolve os slugs de `product_cat` que representam cada tipo da UI.
 *
 * `unresolved` lista os tipos pedidos que não têm nenhuma categoria correspondente — o
 * chamador precisa tratar isso como "nenhum produto", nunca como "sem filtro", senão o
 * catálogo inteiro aparece sob a categoria errada.
 */
export async function getCategoryFilterForTypes(
  types: ReadonlyArray<SpecificProductTypeId>,
): Promise<CategoryFilter> {
  const wanted = Array.from(new Set(types));

  if (wanted.length === 0) {
    return { slugs: [], unresolved: [], available: true };
  }

  const { available, entries } = await getWpProductCategories();

  if (!available) {
    return { slugs: [], unresolved: wanted, available: false };
  }

  const slugs: string[] = [];
  const unresolved: SpecificProductTypeId[] = [];

  for (const type of wanted) {
    const matched = entries
      .filter((entry) => entry.typeId === type && entry.slug)
      .map((entry) => entry.slug);

    if (matched.length === 0) {
      unresolved.push(type);
      continue;
    }

    slugs.push(...matched);
  }

  return { slugs: Array.from(new Set(slugs)), unresolved, available: true };
}

/**
 * Mapa slug → tipo para classificar cada produto pela taxonomia (e não pelo nome).
 */
export async function getCategoryTypeBySlug(): Promise<Map<string, SpecificProductTypeId>> {
  const { entries } = await getWpProductCategories();
  const map = new Map<string, SpecificProductTypeId>();

  for (const entry of entries) {
    if (!entry.typeId || !entry.slug) {
      continue;
    }

    map.set(normalizeTaxonomyText(entry.slug), entry.typeId);
  }

  return map;
}

export async function getTabCounts(): Promise<Record<ProductTypeId, number>> {
  const { entries } = await getWpProductCategories();

  const counts: Record<ProductTypeId, number> = {
    todos: 0,
    sedas: 0,
    piteiras: 0,
    filtros: 0,
    acessorios: 0,
  };

  for (const type of SPECIFIC_PRODUCT_TYPES) {
    const ofType = entries.filter((entry) => entry.typeId === type);
    const roots = ofType.filter((entry) => entry.parentDatabaseId === null);
    const rootCount = roots.reduce((total, entry) => total + entry.count, 0);

    // Produtos ficam atribuídos à raiz e às subcategorias: somar tudo contaria duas vezes.
    // Só quando a raiz está zerada os descendentes viram a melhor estimativa disponível.
    counts[type] =
      rootCount > 0
        ? rootCount
        : ofType.reduce((total, entry) => total + entry.count, 0);
  }

  counts.todos = SPECIFIC_PRODUCT_TYPES.reduce((total, type) => total + counts[type], 0);

  return counts;
}
