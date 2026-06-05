import "server-only";

import { cache } from "react";
import { print } from "graphql";

import { isMockDataEnabled } from "@/lib/server/env";
import { wpGraphqlRequest } from "@/lib/server/wp-graphql";

import { CATEGORIES_QUERY } from "../queries/categories";
import type { ProductTypeId } from "../types/products-catalog";
import { inferProductTypeFromName } from "../utils/infer-product-type-from-name";

export interface WpCategoryEntry {
  databaseId: number;
  slug: string;
  name: string;
  count: number;
  typeId: Exclude<ProductTypeId, "todos">;
}

interface WpCategoryNode {
  databaseId?: number | null;
  slug?: string | null;
  name?: string | null;
  count?: number | null;
}

export const getWpProductCategories = cache(async (): Promise<WpCategoryEntry[]> => {
  if (isMockDataEnabled()) {
    return [];
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
    return [];
  }

  const nodes = data.productCategories?.nodes ?? [];

  return nodes
    .filter((node): node is WpCategoryNode => Boolean(node?.databaseId && node?.slug))
    .map((node) => ({
      databaseId: node.databaseId as number,
      slug: (node.slug ?? "").trim(),
      name: (node.name ?? "").trim(),
      count: typeof node.count === "number" ? node.count : 0,
      typeId: inferProductTypeFromName(`${node.name ?? ""} ${node.slug ?? ""}`),
    }));
});

export async function getCategorySlugsForTypes(
  types: ReadonlyArray<Exclude<ProductTypeId, "todos">>,
): Promise<string[]> {
  if (types.length === 0) {
    return [];
  }

  const categories = await getWpProductCategories();
  const wanted = new Set(types);

  return categories.filter((entry) => wanted.has(entry.typeId)).map((entry) => entry.slug);
}

export async function getTabCounts(): Promise<Record<ProductTypeId, number>> {
  const categories = await getWpProductCategories();

  const counts: Record<ProductTypeId, number> = {
    todos: 0,
    sedas: 0,
    piteiras: 0,
    filtros: 0,
    acessorios: 0,
  };

  for (const entry of categories) {
    counts[entry.typeId] += entry.count;
  }

  counts.todos = counts.sedas + counts.piteiras + counts.filtros + counts.acessorios;

  return counts;
}
