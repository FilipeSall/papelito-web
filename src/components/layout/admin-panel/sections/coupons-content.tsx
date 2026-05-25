import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminCouponsSnapshot } from "@/features/coupons/services/get-admin-coupons";

import { CouponsManager } from "./coupons/coupons-manager";

export async function CouponsContent() {
  const session = await getServerSession(authOptions);
  const snapshot = await getAdminCouponsSnapshot(session?.accessToken, {
    status: "any",
    page: 1,
    perPage: 50,
  });

  return <CouponsManager initialList={snapshot.list} initialIssues={snapshot.issues} />;
}
