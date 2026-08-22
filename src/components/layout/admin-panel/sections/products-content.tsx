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

import { ProductsManager } from "./products/products-manager";
import { KitsManager } from "./products/kits-manager";
import { ProductBenefitsSection } from "./assets/product-benefits/product-benefits-section";
import {
  ProductsTabs,
  type ProductsTab,
} from "./products/components/products-tabs";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function ProductsContent({
  searchParams,
}: {
  searchParams?: AdminSalesPageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const tab = firstString(searchParams?.tab);
  const activeTab: ProductsTab =
    tab === "kits" || tab === "benefits" ? tab : "products";
  const kits =
    activeTab === "benefits"
      ? []
      : await getAdminKitsSnapshot(session?.accessToken);
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
    activeTab === "products" || activeTab === "benefits"
      ? getAdminTaxonomySnapshot(session?.accessToken)
      : null,
    activeTab === "kits"
      ? getAdminFlashSaleProducts(session?.accessToken, { perPage: "48" })
      : null,
    activeTab === "benefits"
      ? getAdminBenefitGroupsSnapshot(session?.accessToken)
      : null,
    activeTab === "benefits"
      ? getAdminFreeShippingThreshold(session?.accessToken)
      : null,
    activeTab === "benefits" ? getPaymentConfig() : null,
    activeTab === "benefits" ? getHomeFlashSale() : null,
  ]);
  const richTextContext = buildRichTextContext({
    freeShippingMinimumCents:
      freeShipping?.threshold?.minimumOrderCents ?? null,
    flashSaleCampaign,
    paymentConfig,
  });
  const focusParam = firstString(searchParams?.focus);
  const issueParam = firstString(searchParams?.issue);
  const initialFocusProductId = Number.parseInt(focusParam ?? "", 10);
  const initialIssue =
    issueParam === "missing-weight" || issueParam === "product-data-incomplete"
      ? issueParam
      : null;

  return (
    <div className="space-y-5">
      <ProductsTabs activeTab={activeTab} />
      {activeTab === "kits" ? (
        <KitsManager
          initialKits={kits}
          initialProducts={candidates?.items ?? []}
        />
      ) : activeTab === "benefits" && benefitsSnapshot && taxonomy ? (
        <ProductBenefitsSection
          categories={taxonomy.categories}
          richTextContext={richTextContext}
          snapshot={benefitsSnapshot}
        />
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
