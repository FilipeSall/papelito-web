import type { ActiveVendor, AvailableVendor, ProductVendorOption } from "../types/active-vendor";

export interface WpActiveVendor {
  vendor_id?: number;
  store_name?: string;
  city?: string;
  state?: string;
  distance_km?: number | null;
  lead_time_days?: number;
  is_default?: boolean;
}

export interface WpAvailableVendor {
  vendor_id?: number;
  store_name?: string;
  city?: string;
  state?: string;
  distance_km?: number | null;
  lead_time_days?: number;
  products_in_stock?: number;
  is_active?: boolean;
  is_nearest?: boolean;
}

export interface WpProductVendor {
  vendor_id?: number;
  store_name?: string;
  city?: string;
  state?: string;
  distance_km?: number | null;
  qty?: number;
  lead_time_days?: number;
  is_active?: boolean;
  is_nearest?: boolean;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapActiveVendor(data: WpActiveVendor): ActiveVendor {
  return {
    vendorId: typeof data.vendor_id === "number" ? data.vendor_id : 0,
    storeName: data.store_name ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    distanceKm: num(data.distance_km),
    leadTimeDays: typeof data.lead_time_days === "number" ? data.lead_time_days : 2,
    isDefault: data.is_default === true,
  };
}

export function mapAvailableVendor(data: WpAvailableVendor): AvailableVendor {
  return {
    vendorId: typeof data.vendor_id === "number" ? data.vendor_id : 0,
    storeName: data.store_name ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    distanceKm: num(data.distance_km),
    leadTimeDays: typeof data.lead_time_days === "number" ? data.lead_time_days : 2,
    productsInStock: typeof data.products_in_stock === "number" ? data.products_in_stock : 0,
    isActive: data.is_active === true,
    isNearest: data.is_nearest === true,
  };
}

export function mapProductVendor(data: WpProductVendor): ProductVendorOption {
  return {
    vendorId: typeof data.vendor_id === "number" ? data.vendor_id : 0,
    storeName: data.store_name ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    distanceKm: num(data.distance_km),
    qty: typeof data.qty === "number" ? data.qty : 0,
    leadTimeDays: typeof data.lead_time_days === "number" ? data.lead_time_days : 2,
    isActive: data.is_active === true,
    isNearest: data.is_nearest === true,
  };
}
