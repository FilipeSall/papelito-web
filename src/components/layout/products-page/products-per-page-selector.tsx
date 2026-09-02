import Link from "next/link";
import { buildProductsHref } from "./products-query-helpers";
import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import {
  getPerPageOptionsForView,
  isPerPageOptionEnabled,
  type ProductsGridLayout,
  type ProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";

type SpecificType = Exclude<ProductTypeId, "todos">;

interface ProductsPerPageSelectorProps {
  basePath?: string;
  collection?: ProductCollectionId;
  selectedTypes: SpecificType[];
  selectedSubcategories?: string[];
  minPrice: number | null;
  maxPrice: number | null;
  viewMode: ProductsViewMode;
  gridLayout?: ProductsGridLayout;
  perPage: number;
  search?: string;
  totalItems?: number;
}

export function ProductsPerPageSelector({
  basePath = "/produtos",
  collection = "todos",
  selectedTypes,
  selectedSubcategories = [],
  minPrice,
  maxPrice,
  viewMode,
  gridLayout = "default",
  perPage,
  search,
  totalItems,
}: ProductsPerPageSelectorProps) {
  const options = getPerPageOptionsForView(viewMode, gridLayout);

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      <span className="px-2 text-xs font-semibold text-text-muted">Itens/página</span>
      {options.map((option) => {
        const isActive = option === perPage;
        const isEnabled =
          isActive ||
          typeof totalItems !== "number" ||
          isPerPageOptionEnabled(options, option, totalItems);

        if (!isEnabled) {
          return (
            <span
              aria-disabled="true"
              className="min-w-10 cursor-not-allowed rounded-md px-2 py-1 text-center text-xs font-black text-text-muted/40"
              key={option}
              title="Não há produtos suficientes para esta opção"
            >
              {option}
            </span>
          );
        }

        return (
          <Link
            key={option}
            href={buildProductsHref({
              basePath,
              collection,
              selectedTypes,
              selectedSubcategories,
              minPrice,
              maxPrice,
              viewMode,
              perPage: option,
              search,
            })}
            className={`min-w-10 rounded-md px-2 py-1 text-center text-xs font-black transition-colors ${
              isActive
                ? "bg-white text-brand-dark shadow-sm"
                : "text-text-secondary hover:bg-gray-200"
            }`}
          >
            {option}
          </Link>
        );
      })}
    </div>
  );
}
