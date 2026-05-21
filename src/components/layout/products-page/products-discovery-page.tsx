import { use } from "react";
import { ProductsHeroBanner, ProductsSection } from "@/components/layout/products-page";
import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import { useProductsCatalog } from "@/features/catalog";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";
import {
  normalizeProductsPerPage,
  normalizeProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";

interface DiscoverySearchParams {
  tipo?: string | string[];
  tipos?: string | string[];
  colecao?: string | string[];
  page?: string | string[];
  view?: string | string[];
  perPage?: string | string[];
  precoMin?: string | string[];
  precoMax?: string | string[];
}

interface ProductsDiscoveryPageProps {
  basePath: string;
  searchParams?: Promise<DiscoverySearchParams> | DiscoverySearchParams;
  initialCollection?: ProductCollectionId;
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

function normalizeCollection(value: string | undefined): ProductCollectionId {
  const normalized = value?.toLowerCase();

  if (
    normalized === "todos" ||
    normalized === "premium" ||
    normalized === "novidades" ||
    normalized === "promocoes" ||
    normalized === "kits"
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

export function ProductsDiscoveryPage({
  basePath,
  searchParams,
  initialCollection = "todos",
}: ProductsDiscoveryPageProps) {
  const resolvedSearchParams = use(Promise.resolve(searchParams ?? {}));
  const coverageCep = use(getAccountCoverageCepContext()).cep;

  const queryType = normalizeType(readSingleParam(resolvedSearchParams.tipo));
  const querySelectedTypes = normalizeSelectedTypes(resolvedSearchParams.tipos);
  const selectedTypes =
    querySelectedTypes.length > 0
      ? querySelectedTypes
      : queryType !== "todos"
        ? [queryType]
        : [];
  const rawCollection = readSingleParam(resolvedSearchParams.colecao);
  const collectionFromQuery = normalizeCollection(rawCollection);
  const hasExplicitCollection =
    typeof rawCollection === "string" && rawCollection.trim().length > 0;
  const activeCollection = hasExplicitCollection ? collectionFromQuery : initialCollection;

  const currentPage = normalizePage(readSingleParam(resolvedSearchParams.page));
  const viewMode = normalizeProductsViewMode(readSingleParam(resolvedSearchParams.view));
  const perPage = normalizeProductsPerPage(
    readSingleParam(resolvedSearchParams.perPage),
    viewMode,
  );
  const minPrice = normalizePrice(readSingleParam(resolvedSearchParams.precoMin));
  const maxPrice = normalizePrice(readSingleParam(resolvedSearchParams.precoMax));

  const [catalog, siteImages] = use(
    Promise.all([
      useProductsCatalog({
        type: queryType,
        collection: activeCollection,
        selectedTypes,
        minPrice,
        maxPrice,
        page: currentPage,
        perPage,
        cep: coverageCep,
      }),
      getSiteImageAssets(),
    ]),
  );

  return (
    <main className="flex flex-col bg-white">
      <ProductsHeroBanner image={siteImages.productHero} />
      <ProductsSection
        basePath={basePath}
        showCollectionFilters
        activeCollection={catalog.activeCollection}
        products={catalog.items}
        tabs={catalog.tabs}
        totalItems={catalog.totalItems}
        totalPages={catalog.totalPages}
        currentPage={catalog.currentPage}
        activeType={catalog.activeType}
        selectedTypes={catalog.selectedTypes}
        minPrice={catalog.minPrice}
        maxPrice={catalog.maxPrice}
        viewMode={viewMode}
        perPage={catalog.perPage}
        coverageCep={catalog.coverageCep}
        coverageStatus={catalog.coverageStatus}
      />
    </main>
  );
}
