import type { VendorCorreiosPreference } from "./vendor-correios";

export type VendorSettings = {
  shippingLeadTimeDays: number;
  shippingLeadTimeConfigured: boolean;
  correios: VendorCorreiosPreference;
  loadFailed: boolean;
};
