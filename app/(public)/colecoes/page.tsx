import { ProductsDiscoveryPage } from "@/components/layout/products-page";
import { buildListingMetadata } from "@/lib/seo/metadata";


export const revalidate = 60;

interface ColecoesPageProps {
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
      };
}

export default function ColecoesPage({ searchParams }: ColecoesPageProps) {
  return <ProductsDiscoveryPage basePath="/colecoes" searchParams={searchParams} />;
}

export async function generateMetadata({ searchParams }: ColecoesPageProps) {
  return buildListingMetadata({
    basePath: "/colecoes",
    title: "Coleções do catálogo",
    description:
      "Navegue pelas coleções do catálogo Papelito — Premium, Kits, Novidades e Promoções — e monte seu pedido de revenda no atacado.",
    searchParams,
  });
}
