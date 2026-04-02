import Link from "next/link";
import type { ProductTypeId } from "@/features/catalog";

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  activeType: ProductTypeId;
  selectedTypes: Exclude<ProductTypeId, "todos">[];
  minPrice: number | null;
  maxPrice: number | null;
}

function buildProductsHref(
  page: number,
  type: ProductTypeId,
  selectedTypes: Exclude<ProductTypeId, "todos">[],
  minPrice: number | null,
  maxPrice: number | null,
) {
  const params = new URLSearchParams();

  if (selectedTypes.length > 1) {
    params.set("tipos", selectedTypes.join(","));
  } else if (type !== "todos") {
    params.set("tipo", type);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  if (typeof minPrice === "number") {
    params.set("precoMin", String(minPrice));
  }
  if (typeof maxPrice === "number") {
    params.set("precoMax", String(maxPrice));
  }

  const query = params.toString();
  return query ? `/produtos?${query}` : "/produtos";
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
  currentPage,
  totalPages,
  activeType,
  selectedTypes,
  minPrice,
  maxPrice,
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
            ? buildProductsHref(
                currentPage - 1,
                activeType,
                selectedTypes,
                minPrice,
                maxPrice,
              )
            : "#"
        }
        aria-disabled={!hasPrevious}
        className={`min-w-10 h-10 inline-flex items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors ${
          hasPrevious
            ? "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
            : "pointer-events-none border-gray-100 bg-gray-50 text-gray-300"
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
            href={buildProductsHref(
              item,
              activeType,
              selectedTypes,
              minPrice,
              maxPrice,
            )}
            aria-current={isActive ? "page" : undefined}
            className={`h-10 min-w-10 inline-flex items-center justify-center rounded-xl border text-sm font-black transition-colors ${
              isActive
                ? "border-brand-dark bg-brand-dark text-white shadow-[0_6px_14px_rgba(35,31,32,0.18)]"
                : "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
            }`}
          >
            {item}
          </Link>
        );
      })}

      <Link
        href={
          hasNext
            ? buildProductsHref(
                currentPage + 1,
                activeType,
                selectedTypes,
                minPrice,
                maxPrice,
              )
            : "#"
        }
        aria-disabled={!hasNext}
        className={`min-w-10 h-10 inline-flex items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors ${
          hasNext
            ? "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
            : "pointer-events-none border-gray-100 bg-gray-50 text-gray-300"
        }`}
      >
        Próxima
      </Link>
    </nav>
  );
}
