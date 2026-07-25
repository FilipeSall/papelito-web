import type { VendorRegistrationStep1Data } from "./revendedor-application";

export type VendorInterestVisibility = "customer" | "public";

export type VendorInterest = VendorRegistrationStep1Data & {
  id: number;
  customerUserId: number | null;
  visibility?: VendorInterestVisibility;
  createdAt: string;
};

export type VendorInterestMeResponse = {
  exists: boolean;
  interest: VendorInterest | null;
};

export type CreateVendorInterestInput = VendorRegistrationStep1Data;

