import Link from "next/link";
import { ViewToggleGridIcon } from "./view-toggle-grid-icon";
import { ViewToggleListIcon } from "./view-toggle-list-icon";
import { buildProductsHref } from "./products-query-helpers";
import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import {
  getDefaultPerPageForView,
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
  search?: string;
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
  search,
}: Readonly<ViewToggleProps>) {
  const defaultGridPerPage = getDefaultPerPageForView("grid");
  const defaultListPerPage = getDefaultPerPageForView("list");

  // `>=`: no default da lista (18) o grid precisa cair para o default dele, senão o link de
  // grade mantém um perPage fora das opções de grade e o seletor fica sem opção ativa.
  const gridPerPage = perPage >= defaultListPerPage ? defaultGridPerPage : perPage;
  const listPerPage = Math.max(perPage, defaultListPerPage);

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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
        className={`p-1.5 rounded-md transition-colors ${
          activeView === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
        }`}
      >
        <ViewToggleGridIcon active={activeView === "grid"} />
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
        className={`p-1.5 rounded-md transition-colors ${
          activeView === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
        }`}
      >
        <ViewToggleListIcon active={activeView === "list"} />
      </Link>
    </div>
  );
}
