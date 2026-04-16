import type { ProductTypeId } from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

type SpecificType = Exclude<ProductTypeId, "todos">;

interface BuildProductsHrefInput {
  selectedTypes: SpecificType[];
  minPrice: number | null;
  maxPrice: number | null;
  viewMode: ProductsViewMode;
  perPage: number;
  page?: number;
}

export function buildProductsHref({
  selectedTypes,
  minPrice,
  maxPrice,
  viewMode,
  perPage,
  page,
}: BuildProductsHrefInput) {
  const params = new URLSearchParams();

  if (selectedTypes.length === 1) {
    params.set("tipo", selectedTypes[0]);
  } else if (selectedTypes.length > 1) {
    params.set("tipos", selectedTypes.join(","));
  }

  if (typeof page === "number" && page > 1) {
    params.set("page", String(page));
  }

  if (typeof minPrice === "number") {
    params.set("precoMin", String(minPrice));
  }

  if (typeof maxPrice === "number") {
    params.set("precoMax", String(maxPrice));
  }

  if (viewMode === "list") {
    params.set("view", "list");
  }

  params.set("perPage", String(perPage));

  const query = params.toString();
  return query ? `/produtos?${query}` : "/produtos";
}
