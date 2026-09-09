import type { VendorFormSourceUser } from "@/features/vendor-registration/types";

export type VendorCreateSourceUser = VendorFormSourceUser;

export type CreatedVendor = {
  email?: string;
  id?: number;
  storeName?: string;
};

export type VendorCreateLauncherProps = Readonly<{
  hideHeading?: boolean;
  initialOpen?: boolean;
  sourceUser?: VendorCreateSourceUser | null;
}>;
