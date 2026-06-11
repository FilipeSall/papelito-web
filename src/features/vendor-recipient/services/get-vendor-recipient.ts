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
};

function emptyRecipient(): VendorRecipient {
  return {
    recipientId: "",
    status: "",
    lastSyncAt: "",
    kycUrl: "",
    lastError: "",
  };
}

export async function getVendorRecipient(): Promise<VendorRecipient> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return emptyRecipient();
  }

  const result = await wpRest<WpVendorRecipient>("/papelito/v1/vendor/recipient", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!result.ok) {
    return emptyRecipient();
  }

  return {
    recipientId: result.data.recipient_id || "",
    status: result.data.status || "",
    lastSyncAt: result.data.last_sync_at || "",
    kycUrl: result.data.kyc_url || "",
    lastError: result.data.last_error || "",
  };
}
