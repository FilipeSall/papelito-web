export interface ActiveVendor {
  vendorId: number;
  storeName: string;
  city: string;
  state: string;
  distanceKm: number | null;
  leadTimeDays: number;
  isDefault: boolean;
}

export interface AvailableVendor {
  vendorId: number;
  storeName: string;
  city: string;
  state: string;
  distanceKm: number | null;
  leadTimeDays: number;
  productsInStock: number;
  isActive: boolean;
  isNearest: boolean;
}

export interface ProductVendorOption {
  vendorId: number;
  storeName: string;
  city: string;
  state: string;
  distanceKm: number | null;
  qty: number;
  leadTimeDays: number;
  isActive: boolean;
  isNearest: boolean;
}

export type ActiveVendorErrorReason =
  | "unauthenticated"
  | "missing_cep"
  | "no_vendor_available"
  | "network"
  | "unknown";

export interface ActiveVendorError {
  reason: ActiveVendorErrorReason;
  message: string;
}
