import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminProductsSnapshot } from "@/lib/server/admin-products";
import { getAdminKitsSnapshot } from "@/lib/server/admin-kits";
import { getAdminFlashSaleProducts } from "@/lib/server/admin-flash-sale";
import { getAdminTaxonomySnapshot } from "@/lib/server/admin-taxonomy";
import type { AdminSalesPageSearchParams } from "@/lib/server/admin-sales-filters";

import { ProductsManager } from "./products/products-manager";
import { KitsManager } from "./products/kits-manager";
import { ProductsTabs, type ProductsTab } from "./products/components/products-tabs";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function ProductsContent({
  searchParams,
}: {
  searchParams?: AdminSalesPageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const activeTab: ProductsTab = firstString(searchParams?.tab) === "kits" ? "kits" : "products";
  const [snapshot, taxonomy, kits, candidates] = await Promise.all([
    activeTab === "products" ? getAdminProductsSnapshot(session?.accessToken, { page: "1", perPage: "20" }) : null,
    activeTab === "products" ? getAdminTaxonomySnapshot(session?.accessToken) : null,
    getAdminKitsSnapshot(session?.accessToken),
    activeTab === "kits" ? getAdminFlashSaleProducts(session?.accessToken, { perPage: "48" }) : null,
  ]);
  const focusParam = firstString(searchParams?.focus);
  const issueParam = firstString(searchParams?.issue);
  const initialFocusProductId = Number.parseInt(focusParam ?? "", 10);
  const initialIssue =
    issueParam === "missing-weight" || issueParam === "product-data-incomplete"
      ? issueParam
      : null;

  return <div className="space-y-5">
    <ProductsTabs activeTab={activeTab} />
    {activeTab === "kits" ? <KitsManager initialKits={kits} initialProducts={candidates?.items ?? []} /> : snapshot && taxonomy ? <ProductsManager
      initialFocusProductId={
        Number.isInteger(initialFocusProductId) && initialFocusProductId > 0
          ? initialFocusProductId
          : null
      }
      initialIssue={initialIssue}
      snapshot={{ ...snapshot, products: snapshot.products.filter((product) => !kits.some((kit) => kit.productId === product.id)) }}
      taxonomy={taxonomy}
    /> : null}
  </div>;
}
