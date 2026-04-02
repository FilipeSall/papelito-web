import { cache } from "react";
import {
  getProductsCatalog,
  type GetProductsCatalogInput,
} from "../services/get-products-catalog";

// TODO: Ajustar estratégia de cache para API real (revalidate + tags de catálogo).
const getCachedProductsCatalog = cache(
  async (
    page: number,
    type: GetProductsCatalogInput["type"],
    selectedTypesKey: string,
    minPrice: number | null,
    maxPrice: number | null,
    perPage: number,
  ) =>
    getProductsCatalog({
      page,
      type,
      selectedTypes:
        selectedTypesKey.length > 0
          ? (selectedTypesKey.split(",") as Exclude<
              NonNullable<GetProductsCatalogInput["selectedTypes"]>[number],
              "todos"
            >[])
          : [],
      minPrice,
      maxPrice,
      perPage,
    }),
);

export async function useProductsCatalog(input: GetProductsCatalogInput = {}) {
  const page = input.page ?? 1;
  const type = input.type ?? "todos";
  const selectedTypesKey = [...(input.selectedTypes ?? [])].sort().join(",");
  const minPrice =
    typeof input.minPrice === "number" && Number.isFinite(input.minPrice)
      ? input.minPrice
      : null;
  const maxPrice =
    typeof input.maxPrice === "number" && Number.isFinite(input.maxPrice)
      ? input.maxPrice
      : null;
  const perPage = input.perPage ?? 9;

  return getCachedProductsCatalog(
    page,
    type,
    selectedTypesKey,
    minPrice,
    maxPrice,
    perPage,
  );
}
