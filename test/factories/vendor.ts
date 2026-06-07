import type { CartVendor } from "@/features/cart";

export function buildVendor(overrides: Partial<CartVendor> = {}): CartVendor {
  return {
    vendorId: 101,
    vendorName: "Vendor Centro",
    city: "Sao Paulo",
    state: "SP",
    distanceKm: 15,
    leadTimeDays: 2,
    ...overrides,
  };
}
