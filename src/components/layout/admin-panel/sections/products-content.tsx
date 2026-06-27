import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminProductsSnapshot } from "@/lib/server/admin-products";
import type { AdminSalesPageSearchParams } from "@/lib/server/admin-sales-filters";

import { ProductsManager } from "./products/products-manager";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function ProductsContent({
  searchParams,
}: {
  searchParams?: AdminSalesPageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const snapshot = await getAdminProductsSnapshot(session?.accessToken, {
    page: "1",
    perPage: "20",
  });
  const focusParam = firstString(searchParams?.focus);
  const issueParam = firstString(searchParams?.issue);
  const initialFocusProductId = Number.parseInt(focusParam ?? "", 10);
  const initialIssue = issueParam === "missing-weight" ? issueParam : null;

  return (
    <ProductsManager
      initialFocusProductId={
        Number.isInteger(initialFocusProductId) && initialFocusProductId > 0
          ? initialFocusProductId
          : null
      }
      initialIssue={initialIssue}
      snapshot={snapshot}
    />
  );
}
