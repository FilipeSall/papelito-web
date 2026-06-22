import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { VendorStockTaxonomies, VendorStockTaxonomyTerm } from "../types/vendor-stock";

type WpTaxTerm = { id?: number; name?: string; slug?: string; count?: number };
type WpTaxonomies = { categories?: WpTaxTerm[]; tags?: WpTaxTerm[] };

function mapTaxTerms(raw?: WpTaxTerm[]): VendorStockTaxonomyTerm[] {
  return (raw ?? [])
    .map((term) => ({
      id: Number(term.id) || 0,
      name: term.name ?? "",
      slug: term.slug ?? "",
      count: Number(term.count) || 0,
    }))
    .filter((term) => term.id > 0);
}

export async function getVendorStockTaxonomies(): Promise<VendorStockTaxonomies> {
  const empty = { categories: [], tags: [] };
  const accessToken = await getSellerAccessToken();
  if (!accessToken) return empty;

  const result = await wpRest<WpTaxonomies>("/papelito/v1/vendor/me/stock/taxonomies", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!result.ok) return empty;

  return {
    categories: mapTaxTerms(result.data.categories),
    tags: mapTaxTerms(result.data.tags),
  };
}
