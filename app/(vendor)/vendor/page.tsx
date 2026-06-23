import { redirect } from "next/navigation";

import { getVendorPendingRegistrationState } from "@/features/revendedor/server/vendor-onboarding";
import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";

export default async function VendorIndexPage() {
  const state = await getVendorPendingRegistrationState();

  redirect(
    state.pendingFields.length > 0
      ? buildVendorOnboardingHref("/vendor/dashboard")
      : "/vendor/dashboard",
  );
}
