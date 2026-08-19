import Link from "next/link";
import { buildProductsHref } from "./products-query-helpers";
import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

interface ProductsPaginationProps {
  basePath?: string;
  collection?: ProductCollectionId;
  currentPage: number;
  totalPages: number;
  selectedTypes: Exclude<ProductTypeId, "todos">[];
  selectedSubcategories?: string[];
  minPrice: number | null;
  maxPrice: number | null;
  viewMode: ProductsViewMode;
  perPage: number;
  search?: string;
  variant?: "default" | "collection";
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ] as const;
}

/**
 * Paginação server-side da listagem de produtos.
 *
 * Renderiza links reais com query params para manter navegação SSR
 * e URL compartilhável.
 */
export function ProductsPagination({
  basePath = "/produtos",
  collection = "todos",
  currentPage,
  totalPages,
  selectedTypes,
  selectedSubcategories = [],
  minPrice,
  maxPrice,
  viewMode,
  perPage,
  search,
  variant = "default",
}: ProductsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const items = getPaginationItems(currentPage, totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Paginação de produtos"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <Link
        href={
          hasPrevious
            ? buildProductsHref({
                basePath,
                collection,
                page: currentPage - 1,
                selectedTypes,
                selectedSubcategories,
                minPrice,
                maxPrice,
                viewMode,
                perPage,
                search,
              })
            : "#"
        }
        aria-disabled={!hasPrevious}
        className={`inline-flex h-10 min-w-10 items-center justify-center px-3 ${variant === "collection" ? "border-2 text-xs font-black uppercase tracking-[0.08em] transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow" : "rounded-xl border text-sm font-bold transition-colors"} ${
          hasPrevious
            ? variant === "collection" ? "border-[#1a1a1a] bg-white text-brand-dark hover:-translate-x-px hover:-translate-y-px hover:bg-brand-yellow hover:shadow-[3px_3px_0px_#1a1a1a]" : "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
            : variant === "collection" ? "pointer-events-none border-gray-300 bg-gray-100 text-gray-400" : "pointer-events-none border-gray-100 bg-gray-50 text-gray-300"
        }`}
      >
        Anterior
      </Link>

      {items.map((item, index) => {
        if (item === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-10 min-w-8 items-center justify-center text-sm font-semibold text-text-muted"
            >
              ...
            </span>
          );
        }

        const isActive = item === currentPage;
        return (
          <Link
            key={item}
            href={buildProductsHref({
              basePath,
              collection,
              page: item,
              selectedTypes,
              selectedSubcategories,
              minPrice,
              maxPrice,
              viewMode,
              perPage,
              search,
            })}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex h-10 min-w-10 items-center justify-center ${variant === "collection" ? "border-2 text-sm font-black transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow" : "rounded-xl border text-sm font-black transition-colors"} ${
              isActive
                ? variant === "collection" ? "border-[#1a1a1a] bg-brand-dark text-brand-yellow shadow-[3px_3px_0px_#ffe500]" : "border-brand-dark bg-brand-dark text-white shadow-[0_6px_14px_rgba(35,31,32,0.18)]"
                : variant === "collection" ? "border-[#1a1a1a] bg-white text-brand-dark hover:-translate-x-px hover:-translate-y-px hover:bg-brand-yellow hover:shadow-[3px_3px_0px_#1a1a1a]" : "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
            }`}
          >
            {item}
          </Link>
        );
      })}

      <Link
        href={
          hasNext
            ? buildProductsHref({
                basePath,
                collection,
                page: currentPage + 1,
                selectedTypes,
                selectedSubcategories,
                minPrice,
                maxPrice,
                viewMode,
                perPage,
                search,
              })
            : "#"
        }
        aria-disabled={!hasNext}
        className={`inline-flex h-10 min-w-10 items-center justify-center px-3 ${variant === "collection" ? "border-2 text-xs font-black uppercase tracking-[0.08em] transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow" : "rounded-xl border text-sm font-bold transition-colors"} ${
          hasNext
            ? variant === "collection" ? "border-[#1a1a1a] bg-white text-brand-dark hover:-translate-x-px hover:-translate-y-px hover:bg-brand-yellow hover:shadow-[3px_3px_0px_#1a1a1a]" : "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
            : variant === "collection" ? "pointer-events-none border-gray-300 bg-gray-100 text-gray-400" : "pointer-events-none border-gray-100 bg-gray-50 text-gray-300"
        }`}
      >
        Próxima
      </Link>
    </nav>
  );
}
