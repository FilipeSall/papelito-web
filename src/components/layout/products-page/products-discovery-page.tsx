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
import { EMPTY_PRICE_RANGE, resolvePriceRange } from "@/features/catalog/utils/price-range";
import { JsonLd, buildItemListJsonLd } from "@/lib/seo/json-ld";
import {
  normalizeProductsPerPage,
  normalizeProductsViewMode,
  resolveProductsGridLayout,
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

const COLLECTION_LIST_NAMES: Record<ProductCollectionId, string> = {
  todos: "Catálogo Papelito",
  premium: "Linha Premium Papelito",
  novidades: "Novidades Papelito",
  promocoes: "Promoções Papelito",
  kits: "Kits Papelito",
};

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

  // Sem categoria marcada não há o que refinar; cada categoria marcada carrega o
  // próprio escopo em `categoria.subcategoria`.
  const selectedSubcategories =
    activeCollection === "todos" && selectedTypes.length > 0
      ? normalizeSubcategoryParam(resolvedSearchParams.subcategoria)
      : [];
  const currentPage = normalizePage(readSingleQueryParam(resolvedSearchParams.page));
  const viewMode = normalizeProductsViewMode(readSingleQueryParam(resolvedSearchParams.view));
  // Coleção específica não tem sidebar: a listagem ocupa a largura cheia e ganha
  // uma quarta coluna. `todos` volta ao grid da vitrine, que tem sidebar.
  const gridLayout = resolveProductsGridLayout("collection", activeCollection);
  const perPage = normalizeProductsPerPage(
    readSingleQueryParam(resolvedSearchParams.perPage),
    viewMode,
    gridLayout,
  );
  const priceRange = activeCollection === "todos"
    ? resolvePriceRange(
      readSingleQueryParam(resolvedSearchParams.precoMin),
      readSingleQueryParam(resolvedSearchParams.precoMax),
    )
    : EMPTY_PRICE_RANGE;
  const { minPrice, maxPrice } = priceRange;
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
      <JsonLd
        data={buildItemListJsonLd(
          COLLECTION_LIST_NAMES[catalog.activeCollection],
          catalog.items.map((item) => ({ name: item.name, path: `/produtos/${item.id}` })),
        )}
      />
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
        categoryTree={catalog.categories}
        selectedSubcategories={catalog.selectedSubcategories}
        selectedTypes={catalog.selectedTypes}
        minPrice={catalog.minPrice}
        maxPrice={catalog.maxPrice}
        priceError={priceRange.kind === "invalid" ? priceRange.message : undefined}
        rawMinPrice={priceRange.rawMinimum}
        rawMaxPrice={priceRange.rawMaximum}
        viewMode={viewMode}
        perPage={catalog.perPage}
        coverageCep={catalog.coverageCep}
        coverageStatus={catalog.coverageStatus}
        sourceStatus={catalog.sourceStatus}
        search={search}
        showSearch
        showCategoryFilters={isAllCollection}
        showCategoryTabs={false}
        gridLayout={gridLayout}
      />
    </main>
  );
}
