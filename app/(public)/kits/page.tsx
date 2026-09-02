import {
  ProductCollectionFilters,
  ProductSearch,
  ProductsGrid,
  ProductsHeroBanner,
  ProductsPerPageSelector,
  ViewToggle,
} from "@/components/layout/products-page";
import { getKitsCatalog } from "@/features/catalog/services/get-kits-catalog";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";
import { ProductAvailabilityProvider } from "@/features/catalog/hooks/use-product-availability";
import { filterKits } from "@/features/catalog/utils/kits-filter";
import { normalizeProductSearch } from "@/features/catalog/utils/product-search";
import { readSingleQueryParam } from "@/features/catalog/utils/product-type-taxonomy";
import {
  normalizeProductsPerPage,
  normalizeProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";
import { JsonLd, buildItemListJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Kits para revenda no atacado",
  description:
    "Kits montados pela Papelito com sedas, piteiras, filtros e acessórios, com preço fechado para lojistas e revendedores. Compra B2B com CNPJ e entrega por revendedor regional.",
  path: "/kits",
});

export const revalidate = 60;

interface KitsPageProps {
  searchParams?:
    | Promise<{
        busca?: string | string[];
        perPage?: string | string[];
        view?: string | string[];
      }>
    | {
        busca?: string | string[];
        perPage?: string | string[];
        view?: string | string[];
      };
}

export default async function KitsPage({ searchParams }: Readonly<KitsPageProps>) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const search = normalizeProductSearch(
    readSingleQueryParam(resolvedSearchParams.busca),
  );
  const viewMode = normalizeProductsViewMode(
    readSingleQueryParam(resolvedSearchParams.view),
  );
  const perPage = normalizeProductsPerPage(
    readSingleQueryParam(resolvedSearchParams.perPage),
    viewMode,
    "collection",
  );

  const [allKits, siteImages] = await Promise.all([
    getKitsCatalog(),
    getSiteImageAssets(),
  ]);
  const kits = filterKits(allKits, search);

  return (
    <main className="flex flex-col bg-white">
      <JsonLd
        data={buildItemListJsonLd(
          "Kits Papelito",
          kits.map((kit) => ({ name: kit.name, path: kit.href ?? `/produtos/${kit.id}` })),
        )}
      />
      <ProductsHeroBanner image={siteImages.productHero} />
      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-4">
          <ProductCollectionFilters
            activeCollection="kits"
            perPage={perPage}
            search={search}
            viewMode={viewMode}
          />
        </div>

        <div className="mb-6">
          <ProductSearch
            basePath="/kits"
            initialValue={search}
            totalItems={kits.length}
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            <span className="font-bold text-brand-dark">{kits.length}</span> kits
            encontrados
          </p>
          <div className="flex flex-wrap items-stretch gap-2">
            <ProductsPerPageSelector
              basePath="/kits"
              gridLayout="collection"
              maxPrice={null}
              minPrice={null}
              perPage={perPage}
              search={search}
              selectedTypes={[]}
              totalItems={kits.length}
              viewMode={viewMode}
            />
            <ViewToggle
              activeView={viewMode}
              basePath="/kits"
              gridLayout="collection"
              maxPrice={null}
              minPrice={null}
              perPage={perPage}
              search={search}
              selectedTypes={[]}
            />
          </div>
        </div>

        <ProductAvailabilityProvider productIds={kits.map((kit) => kit.id)}>
          <ProductsGrid
            gridLayout="collection"
            emptyMessage={
              search
                ? "Nenhum Kit encontrado para essa busca."
                : "Nenhum Kit disponível no momento."
            }
            products={kits}
            viewMode={viewMode}
          />
        </ProductAvailabilityProvider>
      </section>
    </main>
  );
}
