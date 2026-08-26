import { notFound } from "next/navigation";
import { use } from "react";

import { CategoryIntro } from "@/components/layout/category-page";
import { ProductsSection } from "@/components/layout/products-page";
import { useProductsCatalog } from "@/features/catalog";
import {
  findCategoryBySlug,
  getPapelitoTaxonomy,
  type PapelitoCategory,
} from "@/features/catalog/services/get-papelito-categories";
import {
  normalizeProductsPerPage,
  normalizeProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";
import {
  readSingleQueryParam,
  type SpecificProductTypeId,
} from "@/features/catalog/utils/product-type-taxonomy";
import {
  JsonLd,
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

interface CategoriaSearchParams {
  page?: string | string[];
  view?: string | string[];
  perPage?: string | string[];
}

interface CategoriaPageProps {
  params: Promise<{ categoria: string }>;
  searchParams?: Promise<CategoriaSearchParams> | CategoriaSearchParams;
}

/**
 * Pré-gera as quatro categorias da taxonomia Papelito.
 *
 * Taxonomia indisponível no build devolve lista vazia; as rotas continuam válidas e são
 * renderizadas sob demanda, em vez de o build inteiro falhar por causa do WordPress.
 */
export async function generateStaticParams() {
  const taxonomy = await getPapelitoTaxonomy();

  return taxonomy.categories.map((category) => ({ categoria: category.slug }));
}

export async function generateMetadata({ params }: Readonly<CategoriaPageProps>) {
  const { categoria } = await params;
  const category = findCategoryBySlug(await getPapelitoTaxonomy(), categoria);

  if (!category) {
    return { title: "Categoria não encontrada", robots: { index: false, follow: false } };
  }

  return buildPageMetadata({
    title: category.seoTitle || fallbackTitle(category),
    description: category.seoDescription || fallbackDescription(category),
    path: `/categorias/${category.slug}`,
  });
}

/**
 * Landing de categoria — a página feita para ranquear cada categoria do catálogo.
 *
 * A listagem é a mesma da vitrine, com a categoria fixada pela rota. Os filtros e a paginação
 * apontam para `/produtos` (o `basePath` padrão de `ProductsSection`): esta rota é porta de
 * entrada, e o estado de filtro continua morando numa única superfície.
 */
export default function CategoriaPage({ params, searchParams }: Readonly<CategoriaPageProps>) {
  const { categoria } = use(params);
  const resolvedSearchParams: CategoriaSearchParams = use(
    Promise.resolve(searchParams ?? {}),
  );
  const taxonomy = use(getPapelitoTaxonomy());
  const category = findCategoryBySlug(taxonomy, categoria);

  if (!category) {
    notFound();
  }

  const viewMode = normalizeProductsViewMode(readSingleQueryParam(resolvedSearchParams.view));
  const perPage = normalizeProductsPerPage(
    readSingleQueryParam(resolvedSearchParams.perPage),
    viewMode,
  );

  const catalog = use(
    useProductsCatalog({
      type: category.slug as SpecificProductTypeId,
      selectedTypes: [category.slug as SpecificProductTypeId],
      selectedSubcategories: [],
      minPrice: null,
      maxPrice: null,
      page: normalizePage(readSingleQueryParam(resolvedSearchParams.page)),
      perPage,
      search: "",
    }),
  );

  return (
    <main className="flex flex-col bg-white">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Produtos", path: "/produtos" },
          { name: category.name, path: `/categorias/${category.slug}` },
        ])}
      />
      <JsonLd
        data={buildItemListJsonLd(
          category.name,
          catalog.items.map((item) => ({
            name: item.name,
            path: `/produtos/${item.id}`,
          })),
        )}
      />

      <CategoryIntro category={category} />
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
        search=""
        showCategoryFilters
      />
    </main>
  );
}

function fallbackTitle(category: PapelitoCategory) {
  return `${category.name} no atacado para revenda com CNPJ`;
}

function fallbackDescription(category: PapelitoCategory) {
  const facets = category.subcategories.map((subcategory) => subcategory.name).join(", ");
  const options = facets ? ` Opções: ${facets}.` : "";

  return `${category.name} Papelito para tabacarias, headshops, distribuidores e lojistas. Compra B2B com CNPJ e entrega por revendedor regional em todo o Brasil.${options}`;
}

function normalizePage(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}
