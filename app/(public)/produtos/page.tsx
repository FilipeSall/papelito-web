import { use } from "react";
import {
  ProductsHeroBanner,
  ProductsSection,
} from "@/components/layout/products-page";
import type { ProductTypeId } from "@/features/catalog";
import { useProductsCatalog } from "@/features/catalog";

interface ProdutosPageProps {
  searchParams?:
    | Promise<{
        tipo?: string | string[];
        tipos?: string | string[];
        page?: string | string[];
        precoMin?: string | string[];
        precoMax?: string | string[];
      }>
    | {
        tipo?: string | string[];
        tipos?: string | string[];
        page?: string | string[];
        precoMin?: string | string[];
        precoMax?: string | string[];
      };
}

function readSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeType(value: string | undefined): ProductTypeId {
  const normalized = value?.toLowerCase();

  if (
    normalized === "todos" ||
    normalized === "sedas" ||
    normalized === "piteiras" ||
    normalized === "filtros" ||
    normalized === "acessorios"
  ) {
    return normalized;
  }

  return "todos";
}

function normalizeSelectedTypes(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const split = raw
    .flatMap((part) => part.split(","))
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  const allowed = new Set(["sedas", "piteiras", "filtros", "acessorios"]);
  const filtered = split.filter(
    (item): item is "sedas" | "piteiras" | "filtros" | "acessorios" =>
      allowed.has(item),
  );

  return Array.from(new Set(filtered));
}

function normalizePage(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function normalizePrice(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

/**
 * Página de listagem de produtos.
 *
 * Exibe o catálogo completo de produtos da Papelito com:
 * - Banner hero com título e descrição
 * - Filtros por categoria (tabs) via query params
 * - Grid responsivo com paginação server-side
 */
export default function ProdutosPage({ searchParams }: ProdutosPageProps) {
  const resolvedSearchParams = use(Promise.resolve(searchParams ?? {}));

  const queryType = normalizeType(readSingleParam(resolvedSearchParams.tipo));
  const querySelectedTypes = normalizeSelectedTypes(resolvedSearchParams.tipos);
  const selectedTypes =
    querySelectedTypes.length > 0
      ? querySelectedTypes
      : queryType !== "todos"
        ? [queryType]
        : [];

  const currentPage = normalizePage(readSingleParam(resolvedSearchParams.page));
  const minPrice = normalizePrice(readSingleParam(resolvedSearchParams.precoMin));
  const maxPrice = normalizePrice(readSingleParam(resolvedSearchParams.precoMax));

  const catalog = use(
    useProductsCatalog({
      type: queryType,
      selectedTypes,
      minPrice,
      maxPrice,
      page: currentPage,
      perPage: 9,
    }),
  );

  return (
    <main className="flex flex-col bg-white">
      <ProductsHeroBanner />
      <ProductsSection
        products={catalog.items}
        tabs={catalog.tabs}
        totalItems={catalog.totalItems}
        totalPages={catalog.totalPages}
        currentPage={catalog.currentPage}
        activeType={catalog.activeType}
        selectedTypes={catalog.selectedTypes}
        minPrice={catalog.minPrice}
        maxPrice={catalog.maxPrice}
      />
    </main>
  );
}
