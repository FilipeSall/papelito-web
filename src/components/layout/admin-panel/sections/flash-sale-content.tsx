import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminFlashSaleSnapshot } from "@/lib/server/admin-flash-sale";
import { getAdminProductsSnapshot } from "@/lib/server/admin-products";

import { FlashSaleManager } from "./flash-sale";

export async function FlashSaleContent() {
  const session = await getServerSession(authOptions);
  const [snapshot, productsSnapshot] = await Promise.all([
    getAdminFlashSaleSnapshot(session?.accessToken),
    getAdminProductsSnapshot(session?.accessToken, {
      page: "1",
      perPage: "24",
      status: "publish",
    }),
  ]);

  return (
    <FlashSaleManager
      initialCandidates={productsSnapshot.products}
      initialCategories={productsSnapshot.categories}
      initialIssues={[...snapshot.issues, ...productsSnapshot.issues]}
      initialPage={productsSnapshot.currentPage}
      initialPerPage={productsSnapshot.perPage}
      initialTotalPages={productsSnapshot.totalPages}
      initialTotalProducts={productsSnapshot.totalProducts}
      snapshot={snapshot}
    />
  );
}
