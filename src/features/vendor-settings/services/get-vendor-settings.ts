import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { VendorSettings } from "../types/vendor-settings";

type WpVendorSettings = {
  shipping_lead_time_days?: number;
  shipping_lead_time_configured?: boolean;
};

const DEFAULT_LEAD_TIME_DAYS = 2;

function unreadableSettings(): VendorSettings {
  return {
    shippingLeadTimeDays: DEFAULT_LEAD_TIME_DAYS,
    shippingLeadTimeConfigured: false,
    loadFailed: true,
  };
}

export async function getVendorSettings(): Promise<VendorSettings> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return unreadableSettings();
  }

  const result = await wpRest<WpVendorSettings>("/papelito/v1/vendor/me/settings", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 120,
    tags: ["vendor-settings"],
  });

  if (!result.ok) {
    return unreadableSettings();
  }

  return {
    shippingLeadTimeDays: Number(result.data.shipping_lead_time_days) || DEFAULT_LEAD_TIME_DAYS,
    shippingLeadTimeConfigured: result.data.shipping_lead_time_configured === true,
    loadFailed: false,
  };
}
