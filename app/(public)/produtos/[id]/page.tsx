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
import { getHomeFlashSale } from "@/features/catalog/services/get-home-flash-sale";
import { applyFlashSaleToProductDetail } from "@/features/catalog/services/apply-flash-sale-to-product-detail";
import {
  createRegionBlock,
  type RegionBlock,
} from "@/features/catalog/types/region-block";
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
  const [product, flashSaleCampaign, initialIsFavorite, activeVendorResult] = await Promise.all([
    getProductDetail(id),
    getHomeFlashSale(),
    fetchProductFavoriteStatus(id, session?.accessToken),
    session?.user ? getActiveVendor() : Promise.resolve(null),
  ]);

  if (!product) {
    notFound();
  }

  const displayedProduct = applyFlashSaleToProductDetail(product, flashSaleCampaign);

  const activeVendor =
    activeVendorResult && activeVendorResult.ok ? activeVendorResult.vendor : null;
  let selectedVendorStockQty: number | null = null;
  let regionBlock: RegionBlock | null = null;

  if (activeVendorResult && !activeVendorResult.ok) {
    if (activeVendorResult.error.reason === "no_vendor_available") {
      regionBlock = createRegionBlock("no_vendor");
    } else if (activeVendorResult.error.reason === "missing_cep") {
      regionBlock = createRegionBlock("missing_cep");
    }
  }

  if (activeVendor) {
    const { cep } = await getAccountCoverageCepContext();

    if (cep) {
      const coverage = await getCoverage(cep, [displayedProduct.id], activeVendor.vendorId).catch(
        () => null,
      );
      selectedVendorStockQty = coverage?.[displayedProduct.id]?.bestVendor?.qty ?? null;

      if (coverage && coverage[displayedProduct.id]?.hasCoverage === false) {
        regionBlock = createRegionBlock("no_product_coverage");
      }
    } else {
      regionBlock = createRegionBlock("missing_cep");
    }
  }

  return (
    <main className="flex min-h-80 flex-col bg-[#F9FAFB]">
      <ProductBreadcrumbs productName={product.name} />
      <ProductDetailMainSection
        product={displayedProduct}
        initialIsFavorite={initialIsFavorite}
        activeVendor={activeVendor}
        selectedVendorStockQty={selectedVendorStockQty}
        regionBlock={regionBlock}
      />
      <AddToCartToastHost />
    </main>
  );
}
