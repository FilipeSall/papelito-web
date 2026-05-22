import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

import type { ProductVendorOption } from "../types/active-vendor";
import { mapProductVendor, type WpProductVendor } from "./wp-mappers";

export interface ProductVendorOptionsParams {
  productId: number;
  cep: string;
  activeVendorId?: number | null;
  qty?: number;
}

export async function getProductVendorOptions({
  productId,
  cep,
  activeVendorId,
  qty,
}: ProductVendorOptionsParams): Promise<ProductVendorOption[]> {
  if (!Number.isInteger(productId) || productId <= 0) return [];
  if (!cep) return [];

  const params = new URLSearchParams({
    cep,
    product_id: String(productId),
    qty: String(Math.max(1, qty ?? 1)),
  });

  const result = await wpRest<WpProductVendor[]>(
    `/papelito/v1/coverage?${params.toString()}`,
    { revalidate: 30, tags: ["wp:coverage"] },
  );

  if (!result.ok) {
    return [];
  }

  return result.data.map((vendor) => {
    const mapped = mapProductVendor(vendor);

    return {
      ...mapped,
      isActive: activeVendorId ? mapped.vendorId === activeVendorId : mapped.isActive,
    };
  });
}
