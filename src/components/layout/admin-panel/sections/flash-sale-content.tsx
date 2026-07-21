import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  getAdminFlashSaleProducts,
  getAdminFlashSaleSnapshot,
  getFlashSaleProductCategories,
} from "@/lib/server/admin-flash-sale";

import { FlashSaleManager } from "./flash-sale";

export async function FlashSaleContent() {
  const session = await getServerSession(authOptions);
  const [snapshot, productsSnapshot, categories] = await Promise.all([
    getAdminFlashSaleSnapshot(session?.accessToken),
    getAdminFlashSaleProducts(session?.accessToken, {
      page: "1",
      perPage: "24",
    }),
    getFlashSaleProductCategories(session?.accessToken),
  ]);

  return (
    <FlashSaleManager
      initialCandidates={productsSnapshot.items}
      initialCategories={categories}
      initialIssues={[...snapshot.issues, ...productsSnapshot.issues]}
      initialPage={productsSnapshot.page}
      initialPerPage={productsSnapshot.perPage}
      initialTotalPages={productsSnapshot.totalPages}
      initialTotalProducts={productsSnapshot.total}
      snapshot={snapshot}
    />
  );
}
