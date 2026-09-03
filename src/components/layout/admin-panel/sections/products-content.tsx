import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminProductsSnapshot } from "@/lib/server/admin-products";
import { getAdminKitsSnapshot } from "@/lib/server/admin-kits";
import { getAdminFlashSaleProducts } from "@/lib/server/admin-flash-sale";
import { getAdminBenefitGroupsSnapshot } from "@/lib/server/admin-product-benefits";
import { getAdminTaxonomySnapshot } from "@/lib/server/admin-taxonomy";
import { getAdminFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";
import { getHomeFlashSale } from "@/features/catalog/services/get-home-flash-sale";
import { buildRichTextContext } from "@/features/rich-text";
import { getPaymentConfig } from "@/features/rich-text/services/get-payment-config";
import type { AdminSalesPageSearchParams } from "@/lib/server/admin-sales-filters";
import { firstParam } from "@/lib/search-params";

import { SectionHeading } from "../primitives";

import { ProductsManager } from "./products/products-manager";
import { KitsManager } from "./products/kits-manager";
import { UpcomingCardLayout } from "./products/assets/upcoming-card-layout";
import { ProductBenefitsSection } from "./assets/product-benefits/product-benefits-section";
import { ProductsSegments } from "./products/components/products-segments";
import { parseProductsTab, type ProductsTab } from "./products/products-config";

const HEADINGS: Record<ProductsTab, { description: string; title: string }> = {
  assets: {
    description:
      "Os elementos visuais que acompanham o produto na vitrine: o bloco de benefícios exibido abaixo dele e, em breve, o layout do próprio card. Banners, logos e imagens do site continuam em Assets, no menu principal.",
    title: "Assets do produto",
  },
  kits: {
    description:
      "Conjuntos vendidos como um item só, com preço próprio e composição congelada no pedido. Um kit fica disponível quando um mesmo vendor tem saldo de todos os componentes.",
    title: "Kits",
  },
  products: {
    description:
      "O catálogo que a Papelito cadastra e precifica. A categoria da taxonomia é o que coloca o produto na vitrine: publicado sem categoria, ele não aparece para ninguém.",
    title: "Produtos",
  },
};

export async function ProductsContent({
  searchParams,
}: {
  searchParams?: AdminSalesPageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const activeTab = parseProductsTab(firstParam(searchParams?.tab));
  const heading = HEADINGS[activeTab];

  const kits =
    activeTab === "assets" ? [] : await getAdminKitsSnapshot(session?.accessToken);
  const [
    snapshot,
    taxonomy,
    candidates,
    benefitsSnapshot,
    freeShipping,
    paymentConfig,
    flashSaleCampaign,
  ] = await Promise.all([
    activeTab === "products"
      ? getAdminProductsSnapshot(session?.accessToken, {
          exclude: kits.map((kit) => kit.productId),
          page: "1",
          perPage: "20",
        })
      : null,
    activeTab === "products" || activeTab === "assets"
      ? getAdminTaxonomySnapshot(session?.accessToken)
      : null,
    activeTab === "kits"
      ? getAdminFlashSaleProducts(session?.accessToken, { perPage: "48" })
      : null,
    activeTab === "assets"
      ? getAdminBenefitGroupsSnapshot(session?.accessToken)
      : null,
    activeTab === "assets"
      ? getAdminFreeShippingThreshold(session?.accessToken)
      : null,
    activeTab === "assets" ? getPaymentConfig() : null,
    activeTab === "assets" ? getHomeFlashSale() : null,
  ]);
  const richTextContext = buildRichTextContext({
    freeShippingMinimumCents:
      freeShipping?.threshold?.minimumOrderCents ?? null,
    flashSaleCampaign,
    paymentConfig,
  });
  const focusParam = firstParam(searchParams?.focus);
  const issueParam = firstParam(searchParams?.issue);
  const initialFocusProductId = Number.parseInt(focusParam ?? "", 10);
  const initialIssue =
    issueParam === "missing-weight" || issueParam === "product-data-incomplete"
      ? issueParam
      : null;
  const focusKitParam = firstParam(searchParams?.focus);
  const initialFocusKitId = Number.parseInt(focusKitParam ?? "", 10);
  const initialKitIssue =
    issueParam === "shipping-dimensions" ? issueParam : null;

  return (
    <div className="space-y-5">
      <SectionHeading description={heading.description} title={heading.title} />

      <ProductsSegments activeTab={activeTab} />

      {activeTab === "kits" ? (
        <KitsManager
          initialFocusKitId={
            Number.isInteger(initialFocusKitId) && initialFocusKitId > 0
              ? initialFocusKitId
              : null
          }
          initialIssue={initialKitIssue}
          initialKits={kits}
          initialProducts={candidates?.items ?? []}
        />
      ) : activeTab === "assets" && benefitsSnapshot && taxonomy ? (
        <div className="space-y-5">
          <ProductBenefitsSection
            categories={taxonomy.categories}
            richTextContext={richTextContext}
            snapshot={benefitsSnapshot}
          />
          <UpcomingCardLayout />
        </div>
      ) : snapshot && taxonomy ? (
        <ProductsManager
          initialFocusProductId={
            Number.isInteger(initialFocusProductId) && initialFocusProductId > 0
              ? initialFocusProductId
              : null
          }
          initialIssue={initialIssue}
          excludedProductIds={kits.map((kit) => kit.productId)}
          snapshot={{
            ...snapshot,
          }}
          taxonomy={taxonomy}
        />
      ) : null}
    </div>
  );
}
