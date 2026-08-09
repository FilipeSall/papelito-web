import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminCouponsSnapshot } from "@/features/coupons/services/get-admin-coupons";
import { getAdminFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";
import { getAdminPaymentConfig } from "@/features/rich-text/services/get-payment-config";

import { CouponsManager } from "./coupons/coupons-manager";

export async function CouponsContent() {
  const session = await getServerSession(authOptions);
  const [snapshot, freeShipping, paymentConfig] = await Promise.all([
    getAdminCouponsSnapshot(session?.accessToken, {
      status: "any",
      page: 1,
      perPage: 50,
    }),
    getAdminFreeShippingThreshold(session?.accessToken),
    getAdminPaymentConfig(session?.accessToken),
  ]);

  return (
    <CouponsManager
      initialFreeShippingIssue={freeShipping.issues[0]}
      initialFreeShippingMinimumCents={freeShipping.threshold?.minimumOrderCents ?? null}
      initialPaymentConfig={paymentConfig.config}
      initialPaymentIssue={paymentConfig.issues[0]}
      initialList={snapshot.list}
      initialIssues={snapshot.issues}
    />
  );
}
