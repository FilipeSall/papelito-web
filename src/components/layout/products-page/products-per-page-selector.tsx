import Link from "next/link";
import { buildProductsHref } from "./products-query-helpers";
import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import {
  getPerPageOptionsForView,
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
  variant?: "default" | "collection";
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
  variant = "default",
}: ProductsPerPageSelectorProps) {
  const options = getPerPageOptionsForView(viewMode, gridLayout);

  return (
    <div className={variant === "collection" ? "flex items-center gap-1 border-2 border-[#1a1a1a] bg-white p-1" : "flex items-center gap-1 rounded-lg bg-gray-100 p-1"}>
      <span className={variant === "collection" ? "px-1 text-[10px] font-black uppercase tracking-[0.08em] text-text-muted" : "px-2 text-xs font-semibold text-text-muted"}>{variant === "collection" ? "Itens" : "Itens/página"}</span>
      {options.map((option) => {
        const isActive = option === perPage;

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
            className={`px-2 py-1 text-center text-xs font-black transition-colors ${
              variant === "collection" ? "min-w-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow" : "min-w-10 rounded-md"
            } ${
              isActive
                ? variant === "collection" ? "bg-brand-dark text-brand-yellow" : "bg-white text-brand-dark shadow-sm"
                : variant === "collection" ? "text-text-secondary hover:bg-brand-yellow hover:text-brand-dark" : "text-text-secondary hover:bg-gray-200"
            }`}
          >
            {option}
          </Link>
        );
      })}
    </div>
  );
}
