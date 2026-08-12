import { ProductsDiscoveryPage } from "@/components/layout/products-page";

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
