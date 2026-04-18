import { ProductsDiscoveryPage } from "@/components/layout/products-page";

interface KitsPageProps {
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

export default function KitsPage({ searchParams }: KitsPageProps) {
  return (
    <ProductsDiscoveryPage
      basePath="/kits"
      initialCollection="kits"
      searchParams={searchParams}
    />
  );
}
