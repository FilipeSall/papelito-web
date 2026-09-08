import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { ProductCollectionId } from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

interface ProductCollectionFiltersProps {
  activeCollection: ProductCollectionId;
  viewMode: ProductsViewMode;
  perPage: number;
  search?: string;
  collectionCatalog?: Array<{ slug: string; name: string; imageUrl: string; path: string }>;
}

/**
 * Cada coleção tem rota própria, como no corredor de coleções da home. O filtro
 * navega para ela em vez de reescrever `?colecao=` no caminho atual — senão
 * `/premium?colecao=promocoes` serviria promoções sob a URL de premium, e a
 * listagem de kits mandava todo mundo para `/produtos`.
 */
const COLLECTION_FILTERS: Array<{
  id: ProductCollectionId;
  href: string;
  iconSrc?: string;
  label: string;
  subtitle: string;
}> = [
  {
    id: "todos",
    href: "/colecoes",
    iconSrc: "/images/categorias/icons/tudo.webp",
    label: "Tudo",
    subtitle: "Catálogo completo",
  },
  {
    id: "premium",
    href: "/premium",
    label: "Premium",
    subtitle: "Linha premium",
  },
  {
    id: "novidades",
    href: "/novidades",
    label: "Recém Chegados",
    subtitle: "Chegaram agora",
  },
  {
    id: "promocoes",
    href: "/promocoes",
    label: "Promoções",
    subtitle: "Ofertas ativas",
  },
  {
    id: "kits",
    href: "/kits",
    label: "Kits",
    subtitle: "Combos exclusivos",
  },
];

/**
 * Só a preferência de leitura atravessa a troca de coleção. Categoria, faixa de
 * preço e página pertencem ao recorte que ficou para trás.
 */
function buildCollectionHref(
  href: string,
  viewMode: ProductsViewMode,
  perPage: number,
  search?: string,
) {
  const params = new URLSearchParams();

  if (viewMode === "list") {
    params.set("view", "list");
  }

  params.set("perPage", String(perPage));

  if (search?.trim()) {
    params.set("busca", search.trim());
  }

  return `${href}?${params.toString()}`;
}

export function ProductCollectionFilters({
  activeCollection,
  viewMode,
  perPage,
  search,
  collectionCatalog = [],
}: ProductCollectionFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
      {COLLECTION_FILTERS.map((collection) => {
        const isActive = collection.id === activeCollection;
        const source = collectionCatalog.find((entry) => entry.slug === collection.id);

        return (
          <Link
            key={collection.id}
            aria-current={isActive ? "page" : undefined}
            href={buildCollectionHref(source?.path || collection.href, viewMode, perPage, search)}
            className={`group flex min-h-18 items-center gap-2.5 rounded-xl border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow sm:gap-3 ${
              isActive
                ? "border-brand-dark bg-brand-dark text-white"
                : "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
            }`}
          >
            {source?.imageUrl || collection.iconSrc ? (
              <Image
                alt=""
                aria-hidden
                className="h-13 w-13 shrink-0 object-contain sm:h-15 sm:w-15"
                height={60}
                src={source?.imageUrl || collection.iconSrc || ""}
                unoptimized
                width={60}
              />
            ) : (
              <span className="flex h-13 w-13 shrink-0 items-center justify-center border-2 border-current/20 bg-gray-100 sm:h-15 sm:w-15">
                <ImageOff aria-hidden className="h-5 w-5 opacity-45" />
              </span>
            )}
            <div className="min-w-0">
              <p
                className={`truncate text-xs font-bold sm:text-sm ${
                  isActive ? "text-white" : "text-brand-dark"
                }`}
              >
                  {source?.name || collection.label}
              </p>
              <p
                className={`mt-0.5 truncate text-[11px] sm:text-xs ${
                  isActive ? "text-white/70" : "text-text-muted"
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
