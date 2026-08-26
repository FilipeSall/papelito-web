import { ProductsDiscoveryPage } from "@/components/layout/products-page";
import { buildListingMetadata } from "@/lib/seo/metadata";


export const revalidate = 60;

interface PremiumPageProps {
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

export default function PremiumPage({ searchParams }: PremiumPageProps) {
  return (
    <ProductsDiscoveryPage
      basePath="/premium"
      initialCollection="premium"
      searchParams={searchParams}
    />
  );
}

export async function generateMetadata({ searchParams }: PremiumPageProps) {
  return buildListingMetadata({
    basePath: "/premium",
    title: "Linha Premium para revenda",
    description:
      "Sedas e acessórios da linha Premium Papelito para tabacarias, headshops e lojas especializadas. Compra no atacado para empresas com CNPJ.",
    searchParams,
  });
}
