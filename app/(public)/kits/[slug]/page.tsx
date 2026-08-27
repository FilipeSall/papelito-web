import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { ProductBreadcrumbs, ProductDetailMainSection } from "@/components/layout/product-detail-page";
import { resolveProductBenefits } from "@/components/layout/product-benefits-bar";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";
import { getActiveVendor } from "@/features/active-vendor/server";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { getCoverage } from "@/features/catalog/services/get-coverage";
import { getKitDetail } from "@/features/catalog/services/get-kit-detail";
import { getProductBenefits } from "@/features/catalog/services/get-product-benefits";
import { createRegionBlock, type RegionBlock } from "@/features/catalog/types/region-block";
import { fetchProductFavoriteStatus } from "@/features/favorites";
import { getFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";
import { buildRichTextContext } from "@/features/rich-text";
import { getPaymentConfig } from "@/features/rich-text/services/get-payment-config";
import { authOptions } from "@/lib/auth";
import { JsonLd, buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const kit = await getKitDetail(slug);
  if (!kit) return { title: "Kit não encontrado", robots: { index: false, follow: false } };

  return buildPageMetadata({
    title: `${kit.name} — kit para revenda no atacado`,
    description: kit.description || `${kit.name}: kit Papelito para revenda.`,
    path: `/kits/${slug}`,
    ...(kit.image ? { image: { url: kit.image, alt: kit.name } } : {}),
  });
}

export default async function KitDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const [kit, activeVendorResult, freeShippingThreshold, paymentConfig] = await Promise.all([
    getKitDetail(slug),
    session?.user ? getActiveVendor() : Promise.resolve(null),
    getFreeShippingThreshold(),
    getPaymentConfig(),
  ]);
  if (!kit) notFound();

  const [initialIsFavorite, benefits] = await Promise.all([
    fetchProductFavoriteStatus(kit.id, session?.accessToken),
    getProductBenefits(kit.id),
  ]);
  const benefitItems = resolveProductBenefits(
    benefits.items,
    buildRichTextContext({ freeShippingMinimumCents: freeShippingThreshold?.minimumOrderCents ?? null, flashSaleCampaign: null, paymentConfig }),
  );
  const activeVendor = activeVendorResult && activeVendorResult.ok ? activeVendorResult.vendor : null;
  let selectedVendorStockQty: number | null = null;
  let regionBlock: RegionBlock | null = null;

  if (activeVendorResult && !activeVendorResult.ok) {
    regionBlock = createRegionBlock(activeVendorResult.error.reason === "no_vendor_available" ? "no_vendor" : "missing_cep");
  }
  if (activeVendor) {
    const { cep } = await getAccountCoverageCepContext();
    if (!cep) {
      regionBlock = createRegionBlock("missing_cep");
    } else {
      const coverage = await getCoverage(cep, [kit.id], activeVendor.vendorId).catch(() => null);
      selectedVendorStockQty = coverage?.[kit.id]?.bestVendor?.qty ?? null;
      if (coverage?.[kit.id]?.hasCoverage === false) regionBlock = createRegionBlock("no_product_coverage");
    }
  }

  return (
    <main className="flex min-h-80 flex-col bg-[#F9FAFB]">
      <JsonLd data={buildProductJsonLd({ name: kit.name, description: kit.description, image: kit.image, category: kit.category, price: kit.price, path: `/kits/${slug}` })} />
      <JsonLd data={buildBreadcrumbJsonLd([{ name: "Início", path: "/" }, { name: "Kits", path: "/kits" }, { name: kit.name }])} />
      <ProductBreadcrumbs category={{ name: "Kits", slug: "kits", href: "/kits" }} productName={kit.name} />
      <ProductDetailMainSection
        product={kit}
        initialIsFavorite={initialIsFavorite}
        activeVendor={activeVendor}
        selectedVendorStockQty={selectedVendorStockQty}
        regionBlock={regionBlock}
        benefitItems={benefitItems}
        detailPath={`/kits/${slug}`}
        showRelatedProducts={false}
      />
      <AddToCartToastHost />
    </main>
  );
}
