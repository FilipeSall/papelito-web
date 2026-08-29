import type { ProductGridItem } from "@/components/layout/products-page";
import { normalizeKey } from "@/utils/normalize-key";

import { normalizeProductSearch } from "./product-search";

/**
 * Filtra por nome os kits já carregados.
 *
 * O conjunto de kits é pequeno e curado, e `getKitsCatalog` busca todos com
 * cache. Filtrar aqui mantém aquele fetch cacheável, em vez de fragmentá-lo por
 * termo de busca.
 */
export function filterKits(items: ProductGridItem[], search: string) {
  const term = normalizeKey(normalizeProductSearch(search));

  if (!term) {
    return items;
  }

  return items.filter((item) => normalizeKey(item.name).includes(term));
}
