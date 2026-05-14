import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminFlashSaleSnapshot } from "@/lib/server/admin-flash-sale";
import { getAdminProductsSnapshot } from "@/lib/server/admin-products";

import { FlashSaleManager } from "./flash-sale-manager";

export async function FlashSaleContent() {
  const session = await getServerSession(authOptions);
  const [snapshot, candidates] = await Promise.all([
    getAdminFlashSaleSnapshot(session?.accessToken),
    getAdminProductsSnapshot(session?.accessToken, {
      page: "1",
      perPage: "12",
      status: "publish",
    }),
  ]);

  return (
    <FlashSaleManager
      initialCandidates={candidates.products}
      initialIssues={[...snapshot.issues, ...candidates.issues]}
      snapshot={snapshot}
    />
  );
}
