import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type {
  VendorStockCollection,
  VendorStockTaxonomies,
  VendorStockTaxonomyTerm,
} from "../types/vendor-stock";

type WpTaxTerm = { id?: number; name?: string; slug?: string; count?: number };
type WpCollection = { name?: string; slug?: string; count?: number };
type WpTaxonomies = {
  categories?: WpTaxTerm[];
  collections?: WpCollection[];
  tags?: WpTaxTerm[];
};

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

function mapCollections(raw?: WpCollection[]): VendorStockCollection[] {
  return (raw ?? [])
    .map((collection) => ({
      count: Number(collection.count) || 0,
      name: collection.name ?? collection.slug ?? "",
      slug: collection.slug ?? "",
    }))
    .filter((collection) => collection.slug !== "");
}

export async function getVendorStockTaxonomies(): Promise<VendorStockTaxonomies> {
  const empty = { categories: [], collections: [], tags: [] };
  const accessToken = await getSellerAccessToken();
  if (!accessToken) return empty;

  const result = await wpRest<WpTaxonomies>("/papelito/v1/vendor/me/stock/taxonomies", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!result.ok) return empty;

  return {
    categories: mapTaxTerms(result.data.categories),
    collections: mapCollections(result.data.collections),
    tags: mapTaxTerms(result.data.tags),
  };
}
