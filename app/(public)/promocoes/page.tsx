import { ProductsDiscoveryPage } from "@/components/layout/products-page";

export const revalidate = 60;

interface PromocoesPageProps {
  searchParams?:
    | Promise<{
        tipo?: string | string[];
        tipos?: string | string[];
        colecao?: string | string[];
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
        page?: string | string[];
        view?: string | string[];
        perPage?: string | string[];
        precoMin?: string | string[];
        precoMax?: string | string[];
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
