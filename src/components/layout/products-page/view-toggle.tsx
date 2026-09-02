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
  selectedSubcategories?: string[];
  minPrice: number | null;
  maxPrice: number | null;
  perPage: number;
  gridLayout?: ProductsGridLayout;
  search?: string;
}

function getViewStateClassName(view: ProductsViewMode, activeView: ProductsViewMode) {
  return view === activeView ? "bg-white shadow-sm" : "hover:bg-gray-200";
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
  selectedSubcategories = [],
  minPrice,
  maxPrice,
  perPage,
  gridLayout = "default",
  search,
}: Readonly<ViewToggleProps>) {
  const gridPerPageOptions = getPerPageOptionsForView("grid", gridLayout);
  const listPerPageOptions = getPerPageOptionsForView("list");
  const gridStateClassName = getViewStateClassName("grid", activeView);
  const listStateClassName = getViewStateClassName("list", activeView);

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
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      <Link
        aria-label="Visualização em grade"
        href={buildProductsHref({
          basePath,
          collection,
          selectedTypes,
          selectedSubcategories,
          minPrice,
          maxPrice,
          viewMode: "grid",
          perPage: gridPerPage,
          search,
        })}
        className={`rounded-md p-1.5 transition-colors ${gridStateClassName}`}
      >
        <ViewToggleGridIcon active={activeView === "grid"} />
      </Link>
      <Link
        aria-label="Visualização em lista"
        href={buildProductsHref({
          basePath,
          collection,
          selectedTypes,
          selectedSubcategories,
          minPrice,
          maxPrice,
          viewMode: "list",
          perPage: listPerPage,
          search,
        })}
        className={`rounded-md p-1.5 transition-colors ${listStateClassName}`}
      >
        <ViewToggleListIcon active={activeView === "list"} />
      </Link>
    </div>
  );
}
