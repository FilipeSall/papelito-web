import { use } from "react";
import { ProductsHeroBanner, ProductsSection } from "@/components/layout/products-page";
import type { ProductCollectionId } from "@/features/catalog";
import { useProductsCatalog } from "@/features/catalog";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";
import {
  readSingleQueryParam,
  normalizeSubcategoryParam,
  resolveSelectedTypesFromParams,
} from "@/features/catalog/utils/product-type-taxonomy";
import { normalizeProductSearch } from "@/features/catalog/utils/product-search";
import {
  normalizeProductsPerPage,
  normalizeProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";

interface DiscoverySearchParams {
  tipo?: string | string[];
  tipos?: string | string[];
  colecao?: string | string[];
  subcategoria?: string | string[];
  page?: string | string[];
  view?: string | string[];
  perPage?: string | string[];
  precoMin?: string | string[];
  precoMax?: string | string[];
  busca?: string | string[];
}

interface ProductsDiscoveryPageProps {
  basePath: string;
  searchParams?: Promise<DiscoverySearchParams> | DiscoverySearchParams;
  initialCollection?: ProductCollectionId;
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
}: Readonly<ProductsDiscoveryPageProps>) {
  const resolvedSearchParams = use(Promise.resolve(searchParams ?? {}));
  const siteImagesPromise = getSiteImageAssets();

  const { selectedTypes: selectedTypesFromParams } = resolveSelectedTypesFromParams(resolvedSearchParams);
  const rawCollection = readSingleQueryParam(resolvedSearchParams.colecao);
  const collectionFromQuery = normalizeCollection(rawCollection);
  const hasExplicitCollection =
    typeof rawCollection === "string" && rawCollection.trim().length > 0;
  const activeCollection = hasExplicitCollection ? collectionFromQuery : initialCollection;
  const selectedTypes = activeCollection === "todos" ? selectedTypesFromParams : [];
  const queryType = selectedTypes[0] ?? "todos";

  const selectedSubcategories = activeCollection === "todos"
    ? normalizeSubcategoryParam(resolvedSearchParams.subcategoria)
    : [];
  const currentPage = normalizePage(readSingleQueryParam(resolvedSearchParams.page));
  const viewMode = normalizeProductsViewMode(readSingleQueryParam(resolvedSearchParams.view));
  const perPage = normalizeProductsPerPage(
    readSingleQueryParam(resolvedSearchParams.perPage),
    viewMode,
  );
  const minPrice = activeCollection === "todos"
    ? normalizePrice(readSingleQueryParam(resolvedSearchParams.precoMin))
    : null;
  const maxPrice = activeCollection === "todos"
    ? normalizePrice(readSingleQueryParam(resolvedSearchParams.precoMax))
    : null;
  const search = normalizeProductSearch(readSingleQueryParam(resolvedSearchParams.busca));

  const [catalog, siteImages] = use(
    Promise.all([
      useProductsCatalog({
        type: queryType,
        collection: activeCollection,
        selectedTypes,
        selectedSubcategories,
        minPrice,
        maxPrice,
        page: currentPage,
        perPage,
        search,
      }),
      siteImagesPromise,
    ]),
  );
  const isAllCollection = catalog.activeCollection === "todos";

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
        sourceStatus={catalog.sourceStatus}
        search={search}
        showSearch
        showCategoryFilters={isAllCollection}
        visualVariant={basePath === "/produtos" ? "default" : "collection"}
      />
    </main>
  );
}
