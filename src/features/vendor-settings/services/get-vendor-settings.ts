import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { VendorSettings } from "../types/vendor-settings";

type WpVendorSettings = {
  shipping_lead_time_days?: number;
};

export async function getVendorSettings(): Promise<VendorSettings> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return { shippingLeadTimeDays: 2 };
  }

  const result = await wpRest<WpVendorSettings>("/papelito/v1/vendor/me/settings", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 120,
    tags: ["vendor-settings"],
  });

  return {
    shippingLeadTimeDays: result.ok ? Number(result.data.shipping_lead_time_days) || 2 : 2,
  };
}
