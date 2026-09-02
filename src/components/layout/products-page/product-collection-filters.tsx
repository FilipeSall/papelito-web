import Image from "next/image";
import Link from "next/link";
import type { ProductCollectionId } from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

interface ProductCollectionFiltersProps {
  activeCollection: ProductCollectionId;
  viewMode: ProductsViewMode;
  perPage: number;
  search?: string;
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
  iconSrc: string;
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
    iconSrc: "/images/categorias/icons/premium.webp",
    label: "Premium",
    subtitle: "Linha premium",
  },
  {
    id: "novidades",
    href: "/novidades",
    iconSrc: "/images/categorias/icons/novidades.webp",
    label: "Recém Chegados",
    subtitle: "Chegaram agora",
  },
  {
    id: "promocoes",
    href: "/promocoes",
    iconSrc: "/images/categorias/icons/promocoes.webp",
    label: "Promoções",
    subtitle: "Ofertas ativas",
  },
  {
    id: "kits",
    href: "/kits",
    iconSrc: "/images/categorias/icons/kit.webp",
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
}: ProductCollectionFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
      {COLLECTION_FILTERS.map((collection) => {
        const isActive = collection.id === activeCollection;

        return (
          <Link
            key={collection.id}
            aria-current={isActive ? "page" : undefined}
            href={buildCollectionHref(collection.href, viewMode, perPage, search)}
            className={`group flex min-h-18 items-center gap-2.5 rounded-xl border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow sm:gap-3 ${
              isActive
                ? "border-brand-dark bg-brand-dark text-white"
                : "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
            }`}
          >
            <Image
              alt=""
              aria-hidden
              className="h-13 w-13 shrink-0 object-contain sm:h-15 sm:w-15"
              height={60}
              src={collection.iconSrc}
              unoptimized
              width={60}
            />
            <div className="min-w-0">
              <p
                className={`truncate text-xs font-bold sm:text-sm ${
                  isActive ? "text-white" : "text-brand-dark"
                }`}
              >
                {collection.label}
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
