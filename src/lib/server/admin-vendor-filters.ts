import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";
import { isVendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";
import type { AdminVendorStockFilter } from "@/lib/server/admin-vendor-operations";

export function normalizeAdminRole(role: unknown): string | undefined {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export function parseStockFilter(value: string | null | undefined): AdminVendorStockFilter {
  return value === "with_stock" || value === "zeroed_only" ? value : "all";
}

export function parseVendorOrderStatus(value: string | null | undefined): VendorOrderStatus | "all" {
  return isVendorOrderStatus(value) ? value : "all";
}
