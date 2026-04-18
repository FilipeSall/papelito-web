import Link from "next/link";
import { buildProductsHref } from "./products-query-helpers";
import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

type SpecificType = Exclude<ProductTypeId, "todos">;

interface ProductCollectionFiltersProps {
  basePath: string;
  activeCollection: ProductCollectionId;
  selectedTypes: SpecificType[];
  minPrice: number | null;
  maxPrice: number | null;
  viewMode: ProductsViewMode;
  perPage: number;
}

const COLLECTION_FILTERS: Array<{
  id: ProductCollectionId;
  emoji: string;
  label: string;
  subtitle: string;
}> = [
  { id: "todos", emoji: "🧭", label: "Tudo", subtitle: "Catálogo completo" },
  { id: "premium", emoji: "⭐", label: "Premium", subtitle: "Linha premium" },
  {
    id: "novidades",
    emoji: "🔥",
    label: "Recém Chegados",
    subtitle: "Chegaram agora",
  },
  {
    id: "promocoes",
    emoji: "💥",
    label: "Promoções",
    subtitle: "Ofertas ativas",
  },
  { id: "kits", emoji: "🎁", label: "Kits", subtitle: "Combos exclusivos" },
];

export function ProductCollectionFilters({
  basePath,
  activeCollection,
  selectedTypes,
  minPrice,
  maxPrice,
  viewMode,
  perPage,
}: ProductCollectionFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      {COLLECTION_FILTERS.map((collection) => {
        const isActive = collection.id === activeCollection;

        return (
          <Link
            key={collection.id}
            href={buildProductsHref({
              basePath,
              collection: collection.id,
              selectedTypes,
              minPrice,
              maxPrice,
              viewMode,
              perPage,
            })}
            className={`group relative overflow-hidden rounded-2xl border px-4 py-3 transition-all ${
              isActive
                ? "border-brand-dark bg-brand-dark text-white shadow-[0_14px_28px_rgba(35,31,32,0.2)]"
                : "border-gray-200 bg-white text-brand-dark hover:-translate-y-0.5 hover:border-brand-dark/25 hover:shadow-[0_10px_20px_rgba(17,17,17,0.1)]"
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity ${
                isActive ? "bg-[radial-gradient(circle_at_85%_10%,#fef08a_0,transparent_56%)]" : ""
              }`}
            />
            <div className="relative flex items-start gap-2">
              <span className="text-lg leading-none">{collection.emoji}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-[0.9px]">
                  {collection.label}
                </p>
                <p
                  className={`truncate text-[11px] ${
                    isActive ? "text-white/75" : "text-text-muted"
                  }`}
                >
                  {collection.subtitle}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
