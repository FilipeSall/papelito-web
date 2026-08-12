import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

type SpecificType = Exclude<ProductTypeId, "todos">;

interface BuildProductsHrefInput {
  basePath?: string;
  collection?: ProductCollectionId;
  selectedTypes: SpecificType[];
  selectedSubcategories?: string[];
  minPrice: number | null;
  maxPrice: number | null;
  viewMode: ProductsViewMode;
  perPage: number;
  page?: number;
  search?: string;
}

export function buildProductsHref({
  basePath = "/produtos",
  collection = "todos",
  selectedTypes,
  selectedSubcategories = [],
  minPrice,
  maxPrice,
  viewMode,
  perPage,
  page,
  search,
}: BuildProductsHrefInput) {
  const params = new URLSearchParams();

  if (selectedTypes.length === 1) {
    params.set("tipo", selectedTypes[0]);
  } else if (selectedTypes.length > 1) {
    params.set("tipos", selectedTypes.join(","));
  }

  if (selectedSubcategories.length > 0) {
    params.set("subcategoria", selectedSubcategories.join(","));
  }

  if (collection !== "todos" || basePath !== "/produtos") {
    params.set("colecao", collection);
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

  if (search?.trim()) {
    params.set("busca", search.trim());
  }

  params.set("perPage", String(perPage));

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
