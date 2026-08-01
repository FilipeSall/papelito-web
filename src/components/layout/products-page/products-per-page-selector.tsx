import Link from "next/link";
import { buildProductsHref } from "./products-query-helpers";
import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import {
  getPerPageOptionsForView,
  type ProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";

type SpecificType = Exclude<ProductTypeId, "todos">;

interface ProductsPerPageSelectorProps {
  basePath?: string;
  collection?: ProductCollectionId;
  selectedTypes: SpecificType[];
  minPrice: number | null;
  maxPrice: number | null;
  viewMode: ProductsViewMode;
  perPage: number;
  search?: string;
}

export function ProductsPerPageSelector({
  basePath = "/produtos",
  collection = "todos",
  selectedTypes,
  minPrice,
  maxPrice,
  viewMode,
  perPage,
  search,
}: ProductsPerPageSelectorProps) {
  const options = getPerPageOptionsForView(viewMode);

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      <span className="px-2 text-xs font-semibold text-text-muted">Itens/página</span>
      {options.map((option) => {
        const isActive = option === perPage;

        return (
          <Link
            key={option}
            href={buildProductsHref({
              basePath,
              collection,
              selectedTypes,
              minPrice,
              maxPrice,
              viewMode,
              perPage: option,
              search,
            })}
            className={`min-w-10 rounded-md px-2 py-1 text-center text-xs font-black transition-colors ${
              isActive ? "bg-white text-brand-dark shadow-sm" : "text-text-secondary hover:bg-gray-200"
            }`}
          >
            {option}
          </Link>
        );
      })}
    </div>
  );
}
