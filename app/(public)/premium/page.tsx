import { ProductsDiscoveryPage } from "@/components/layout/products-page";

export const revalidate = 60;

interface PremiumPageProps {
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

export default function PremiumPage({ searchParams }: PremiumPageProps) {
  return (
    <ProductsDiscoveryPage
      basePath="/premium"
      initialCollection="premium"
      searchParams={searchParams}
    />
  );
}
