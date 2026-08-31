import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { VendorRecipient } from "../types/vendor-recipient";

type WpVendorRecipient = {
  recipient_id?: string;
  status?: string;
  last_sync_at?: string;
  kyc_url?: string;
  last_error?: string;
  last_error_code?: string;
};

function unreadableRecipient(): VendorRecipient {
  return {
    recipientId: "",
    status: "",
    lastSyncAt: "",
    kycUrl: "",
    lastError: "",
    lastErrorCode: "",
    loadFailed: true,
  };
}

export async function getVendorRecipient(): Promise<VendorRecipient> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return unreadableRecipient();
  }

  const result = await wpRest<WpVendorRecipient>("/papelito/v1/vendor/recipient", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    revalidate: 300,
    tags: ["vendor-recipient"],
  });

  if (!result.ok) {
    return unreadableRecipient();
  }

  return {
    recipientId: result.data.recipient_id || "",
    status: result.data.status || "",
    lastSyncAt: result.data.last_sync_at || "",
    kycUrl: result.data.kyc_url || "",
    lastError: result.data.last_error || "",
    lastErrorCode: result.data.last_error_code || "",
    loadFailed: false,
  };
}
