import { ProductsDiscoveryPage } from "@/components/layout/products-page";
import { buildListingMetadata } from "@/lib/seo/metadata";


export const revalidate = 60;

interface PromocoesPageProps {
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

export default function PromocoesPage({ searchParams }: PromocoesPageProps) {
  return (
    <ProductsDiscoveryPage
      basePath="/promocoes"
      initialCollection="promocoes"
      searchParams={searchParams}
    />
  );
}

export async function generateMetadata({ searchParams }: PromocoesPageProps) {
  return buildListingMetadata({
    basePath: "/promocoes",
    title: "Promoções do catálogo",
    description:
      "Ofertas vigentes em sedas, piteiras, filtros e acessórios Papelito para lojistas, distribuidores e revendedores.",
    searchParams,
  });
}
