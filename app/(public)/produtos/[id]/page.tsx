import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import {
  ProductBreadcrumbs,
  ProductDetailMainSection,
} from "@/components/layout/product-detail-page";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";
import { fetchProductFavoriteStatus } from "@/features/favorites";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { getCoverage } from "@/features/catalog/services/get-coverage";
import { getProductDetail } from "@/features/catalog/services/get-product-detail";
import { getActiveVendor } from "@/features/active-vendor/server";
import { authOptions } from "@/lib/auth";

interface ProdutoDetalhePageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página dedicada de produto (MVP).
 *
 * Nesta etapa inicial, renderiza apenas o breadcrumb seguindo
 * as especificações do Figma.
 */
export default async function ProdutoDetalhePage({
  params,
}: ProdutoDetalhePageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const [product, initialIsFavorite, activeVendorResult] = await Promise.all([
    getProductDetail(id),
    fetchProductFavoriteStatus(id, session?.accessToken),
    session?.user ? getActiveVendor() : Promise.resolve(null),
  ]);

  if (!product) {
    notFound();
  }

  const activeVendor =
    activeVendorResult && activeVendorResult.ok ? activeVendorResult.vendor : null;
  let selectedVendorStockQty: number | null = null;

  if (activeVendor) {
    const { cep } = await getAccountCoverageCepContext();

    if (cep) {
      const coverage = await getCoverage(cep, [product.id], activeVendor.vendorId).catch(
        () => null,
      );
      selectedVendorStockQty = coverage?.[product.id]?.bestVendor?.qty ?? null;
    }
  }

  return (
    <main className="flex min-h-80 flex-col bg-[#F9FAFB]">
      <ProductBreadcrumbs productName={product.name} />
      <ProductDetailMainSection
        product={product}
        initialIsFavorite={initialIsFavorite}
        activeVendor={activeVendor}
        selectedVendorStockQty={selectedVendorStockQty}
      />
      <AddToCartToastHost />
    </main>
  );
}
