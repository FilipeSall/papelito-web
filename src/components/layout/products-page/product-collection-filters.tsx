import Image from "next/image";
import Link from "next/link";
import { buildProductsHref } from "./products-query-helpers";
import type { ProductCollectionId } from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

interface ProductCollectionFiltersProps {
  basePath: string;
  activeCollection: ProductCollectionId;
  viewMode: ProductsViewMode;
  perPage: number;
  search?: string;
}

const COLLECTION_FILTERS: Array<{
  id: ProductCollectionId;
  iconSrc: string;
  label: string;
  subtitle: string;
}> = [
  {
    id: "todos",
    iconSrc: "/images/categorias/icons/tudo.webp",
    label: "Tudo",
    subtitle: "Catálogo completo",
  },
  {
    id: "premium",
    iconSrc: "/images/categorias/icons/premium.webp",
    label: "Premium",
    subtitle: "Linha premium",
  },
  {
    id: "novidades",
    iconSrc: "/images/categorias/icons/novidades.webp",
    label: "Recém Chegados",
    subtitle: "Chegaram agora",
  },
  {
    id: "promocoes",
    iconSrc: "/images/categorias/icons/promocoes.webp",
    label: "Promoções",
    subtitle: "Ofertas ativas",
  },
  {
    id: "kits",
    iconSrc: "/images/categorias/icons/kit.webp",
    label: "Kits",
    subtitle: "Combos exclusivos",
  },
];

export function ProductCollectionFilters({
  basePath,
  activeCollection,
  viewMode,
  perPage,
  search,
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
              selectedTypes: [],
              minPrice: null,
              maxPrice: null,
              viewMode,
              perPage,
              search,
            })}
            className={`group relative flex min-h-24 items-center gap-3 border-2 border-[#1a1a1a] px-3 py-3 text-brand-dark transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow ${
              isActive
                ? "bg-brand-dark text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-1 after:bg-brand-yellow"
                : "bg-white hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand-yellow hover:shadow-[2px_2px_0px_#1a1a1a]"
            }`}
          >
            <Image
              alt=""
              aria-hidden
              className="relative z-10 h-[52px] w-[52px] shrink-0 object-contain"
              height={52}
              src={collection.iconSrc}
              unoptimized
              width={52}
            />
            <div className="relative z-10 min-w-0">
              <p
                className={`truncate text-xs font-black uppercase tracking-[0.075em] ${
                  isActive ? "text-white" : "text-brand-dark"
                }`}
              >
                {collection.label}
              </p>
              <p
                className={`mt-1 truncate text-[11px] ${
                  isActive ? "text-white/80" : "text-text-secondary group-hover:text-brand-dark"
                }`}
              >
                {collection.subtitle}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
