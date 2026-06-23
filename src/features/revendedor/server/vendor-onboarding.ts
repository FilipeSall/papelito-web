import "server-only";

import { redirect } from "next/navigation";

import type { VendorPendingRegistrationResponse } from "@/features/revendedor/types/revendedor-application";
import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";
import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

const VENDOR_PENDING_REGISTRATION_PATH = "/papelito/v1/vendor/registration-pending";

function emptyPendingRegistrationState(): VendorPendingRegistrationResponse {
  return {
    draft: null,
    pendingFields: [],
  };
}

export async function getVendorPendingRegistrationState(): Promise<VendorPendingRegistrationResponse> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return emptyPendingRegistrationState();
  }

  const result = await wpRest<VendorPendingRegistrationResponse>(VENDOR_PENDING_REGISTRATION_PATH, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!result.ok) {
    return emptyPendingRegistrationState();
  }

  return {
    draft: result.data.draft ?? null,
    pendingFields: Array.isArray(result.data.pendingFields) ? result.data.pendingFields : [],
    application: result.data.application,
    updatedAt: result.data.updatedAt,
  };
}

export async function redirectIfVendorOnboardingPending(returnTo?: string): Promise<void> {
  const state = await getVendorPendingRegistrationState();

  if (state.pendingFields.length > 0) {
    redirect(buildVendorOnboardingHref(returnTo));
  }
}
