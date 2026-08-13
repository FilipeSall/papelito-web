import Link from "next/link";
import { ViewToggleGridIcon } from "./view-toggle-grid-icon";
import { ViewToggleListIcon } from "./view-toggle-list-icon";
import { buildProductsHref } from "./products-query-helpers";
import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import {
  getDefaultPerPageForView,
  getPerPageOptionsForView,
  type ProductsGridLayout,
  type ProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";

type SpecificType = Exclude<ProductTypeId, "todos">;

interface ViewToggleProps {
  /** Modo de visualização atual */
  activeView?: ProductsViewMode;
  basePath?: string;
  collection?: ProductCollectionId;
  selectedTypes: SpecificType[];
  minPrice: number | null;
  maxPrice: number | null;
  perPage: number;
  gridLayout?: ProductsGridLayout;
  search?: string;
  variant?: "default" | "collection";
}

function getViewStateClassName(
  view: ProductsViewMode,
  activeView: ProductsViewMode,
  isCollectionVariant: boolean,
) {
  const isActive = view === activeView;

  if (isCollectionVariant) {
    if (isActive) return "bg-brand-dark";
    return "hover:bg-brand-yellow";
  }

  if (isActive) return "bg-white shadow-sm";
  return "hover:bg-gray-200";
}

/**
 * Alternador de visualização entre grade e lista.
 *
 * Exibe dois botões de ícone para alternar entre visualização em grid
 * e visualização em lista. O modo ativo é destacado com cor escura.
 *
 * @example
 * ```tsx
 * <ViewToggle activeView="grid" />
 * ```
 */
export function ViewToggle({
  activeView = "grid",
  basePath = "/produtos",
  collection = "todos",
  selectedTypes,
  minPrice,
  maxPrice,
  perPage,
  gridLayout = "default",
  search,
  variant = "default",
}: Readonly<ViewToggleProps>) {
  const gridPerPageOptions = getPerPageOptionsForView("grid", gridLayout);
  const listPerPageOptions = getPerPageOptionsForView("list");
  const isCollectionVariant = variant === "collection";
  const containerClassName = isCollectionVariant
    ? "flex items-center gap-1 border-2 border-[#1a1a1a] bg-white p-1"
    : "flex items-center gap-1 rounded-lg bg-gray-100 p-1";
  const itemClassName = isCollectionVariant
    ? "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
    : "rounded-md";
  const gridStateClassName = getViewStateClassName(
    "grid",
    activeView,
    isCollectionVariant,
  );
  const listStateClassName = getViewStateClassName(
    "list",
    activeView,
    isCollectionVariant,
  );

  // Trocar de visualização com um perPage fora das opções do destino deixa o seletor sem
  // opção ativa e a URL divergente do que a interface mostra: cada link cai no default do
  // seu próprio par visualização/grid quando o valor atual não serve lá.
  const gridPerPage = gridPerPageOptions.includes(perPage)
    ? perPage
    : getDefaultPerPageForView("grid", gridLayout);
  const listPerPage = listPerPageOptions.includes(perPage)
    ? perPage
    : getDefaultPerPageForView("list");

  return (
    <div className={containerClassName}>
      <Link
        aria-label="Visualização em grade"
        href={buildProductsHref({
          basePath,
          collection,
          selectedTypes,
          minPrice,
          maxPrice,
          viewMode: "grid",
          perPage: gridPerPage,
          search,
        })}
        className={`p-1.5 transition-colors ${itemClassName} ${gridStateClassName}`}
      >
        <ViewToggleGridIcon active={activeView === "grid"} variant={variant} />
      </Link>
      <Link
        aria-label="Visualização em lista"
        href={buildProductsHref({
          basePath,
          collection,
          selectedTypes,
          minPrice,
          maxPrice,
          viewMode: "list",
          perPage: listPerPage,
          search,
        })}
        className={`p-1.5 transition-colors ${itemClassName} ${listStateClassName}`}
      >
        <ViewToggleListIcon active={activeView === "list"} variant={variant} />
      </Link>
    </div>
  );
}
