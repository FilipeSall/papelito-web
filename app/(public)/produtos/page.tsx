import { use } from "react";
import {
  ProductsHeroBanner,
  ProductsSection,
} from "@/components/layout/products-page";
import { useProductsCatalog } from "@/features/catalog";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";
import {
  normalizeSubcategoryParam,
  readSingleQueryParam,
  resolveSelectedTypesFromParams,
} from "@/features/catalog/utils/product-type-taxonomy";
import {
  normalizeProductsPerPage,
  normalizeProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";
import { JsonLd, buildItemListJsonLd } from "@/lib/seo/json-ld";
import { buildListingMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

interface ProdutosPageProps {
  searchParams?:
    | Promise<{
        tipo?: string | string[];
        tipos?: string | string[];
        subcategoria?: string | string[];
        page?: string | string[];
        view?: string | string[];
        perPage?: string | string[];
        precoMin?: string | string[];
        precoMax?: string | string[];
        busca?: string | string[];
      }>
    | {
        tipo?: string | string[];
        tipos?: string | string[];
        subcategoria?: string | string[];
        page?: string | string[];
        view?: string | string[];
        perPage?: string | string[];
        precoMin?: string | string[];
        precoMax?: string | string[];
        busca?: string | string[];
      };
}

export async function generateMetadata({ searchParams }: Readonly<ProdutosPageProps>) {
  return buildListingMetadata({
    basePath: "/produtos",
    title: "Catálogo completo — sedas, piteiras, filtros e acessórios no atacado",
    description:
      "Catálogo B2B completo da Papelito para tabacarias, headshops, distribuidores, lojistas e revendedores. Preço de revenda, compra com CNPJ e entrega por revendedor regional em todo o Brasil.",
    searchParams,
  });
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
export default function ProdutosPage({ searchParams }: Readonly<ProdutosPageProps>) {
  const resolvedSearchParams = use(Promise.resolve(searchParams ?? {}));
  const siteImagesPromise = getSiteImageAssets();

  const { queryType, selectedTypes } = resolveSelectedTypesFromParams(resolvedSearchParams);
  // Sem categoria marcada não há o que refinar; cada categoria marcada carrega o
  // próprio escopo em `categoria.subcategoria`.
  const selectedSubcategories =
    selectedTypes.length > 0
      ? normalizeSubcategoryParam(resolvedSearchParams.subcategoria)
      : [];

  const currentPage = normalizePage(readSingleQueryParam(resolvedSearchParams.page));
  const viewMode = normalizeProductsViewMode(
    readSingleQueryParam(resolvedSearchParams.view),
  );
  const perPage = normalizeProductsPerPage(
    readSingleQueryParam(resolvedSearchParams.perPage),
    viewMode,
  );
  const minPrice = normalizePrice(readSingleQueryParam(resolvedSearchParams.precoMin));
  const maxPrice = normalizePrice(readSingleQueryParam(resolvedSearchParams.precoMax));
  const search = readSingleQueryParam(resolvedSearchParams.busca) ?? "";

  const [catalog, siteImages] = use(
    Promise.all([
      useProductsCatalog({
        type: queryType,
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

  return (
    <main className="flex flex-col bg-white">
      <JsonLd
        data={buildItemListJsonLd(
          "Catálogo Papelito",
          catalog.items.map((item) => ({ name: item.name, path: `/produtos/${item.id}` })),
        )}
      />
      <ProductsHeroBanner image={siteImages.productHero} />
      <ProductsSection
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
        viewMode={viewMode}
        perPage={catalog.perPage}
        coverageCep={catalog.coverageCep}
        coverageStatus={catalog.coverageStatus}
        sourceStatus={catalog.sourceStatus}
        search={search}
        showSearch
        showCategoryFilters
      />
    </main>
  );
}
