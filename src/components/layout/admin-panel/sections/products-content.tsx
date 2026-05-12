import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminProductsSnapshot } from "@/lib/server/admin-products";

import { ProductsManager } from "./products/products-manager";

export async function ProductsContent() {
  const session = await getServerSession(authOptions);
  const snapshot = await getAdminProductsSnapshot(session?.accessToken, {
    page: "1",
    perPage: "20",
  });

  return <ProductsManager snapshot={snapshot} />;
}
