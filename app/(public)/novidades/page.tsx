import { ProductsDiscoveryPage } from "@/components/layout/products-page";

interface NovidadesPageProps {
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

export default function NovidadesPage({ searchParams }: NovidadesPageProps) {
  return (
    <ProductsDiscoveryPage
      basePath="/novidades"
      initialCollection="novidades"
      searchParams={searchParams}
    />
  );
}
