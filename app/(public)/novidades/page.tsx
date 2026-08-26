import { ProductsDiscoveryPage } from "@/components/layout/products-page";
import { buildListingMetadata } from "@/lib/seo/metadata";


export const revalidate = 60;

interface NovidadesPageProps {
  searchParams?:
    | Promise<{
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
      }>
    | {
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
      };
}

export default function NovidadesPage({ searchParams }: NovidadesPageProps) {
  return (
    <ProductsDiscoveryPage
      basePath="/novidades"
      initialCollection="novidades"
      searchParams={searchParams}
    />
  );
}

export async function generateMetadata({ searchParams }: NovidadesPageProps) {
  return buildListingMetadata({
    basePath: "/novidades",
    title: "Novidades do catálogo",
    description:
      "Últimos lançamentos de sedas, piteiras, filtros e acessórios Papelito disponíveis para revenda no atacado em todo o Brasil.",
    searchParams,
  });
}
