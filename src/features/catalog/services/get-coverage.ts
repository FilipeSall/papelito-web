import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

export interface CatalogCoverageVendor {
  vendorId: number;
  storeName: string;
  city: string;
  state: string;
  distanceKm: number;
  qty: number;
  leadTimeDays: number;
}

export interface ProductCoverage {
  hasCoverage: boolean;
  bestVendor: CatalogCoverageVendor | null;
  alternatives: CatalogCoverageVendor[];
}

export type ProductsCoverageMap = Record<string, ProductCoverage>;

interface WpCoverageVendor {
  vendor_id?: number;
  store_name?: string;
  city?: string;
  state?: string;
  distance_km?: number;
  qty?: number;
  lead_time_days?: number;
}

interface WpProductCoverage {
  has_coverage?: boolean;
  best_vendor?: WpCoverageVendor | null;
  alternatives?: WpCoverageVendor[];
}

type WpProductsCoverageResponse = Record<string, WpProductCoverage>;

function mapVendor(vendor: WpCoverageVendor): CatalogCoverageVendor {
  return {
    vendorId: typeof vendor.vendor_id === "number" ? vendor.vendor_id : 0,
    storeName: vendor.store_name ?? "",
    city: vendor.city ?? "",
    state: vendor.state ?? "",
    distanceKm: typeof vendor.distance_km === "number" ? vendor.distance_km : 0,
    qty: typeof vendor.qty === "number" ? vendor.qty : 0,
    leadTimeDays: typeof vendor.lead_time_days === "number" ? vendor.lead_time_days : 2,
  };
}

function mapCoverage(item: WpProductCoverage): ProductCoverage {
  const bestVendor = item.best_vendor ? mapVendor(item.best_vendor) : null;

  return {
    hasCoverage: item.has_coverage === true && bestVendor !== null,
    bestVendor,
    alternatives: (item.alternatives ?? []).map(mapVendor),
  };
}

export async function getCoverage(
  cep: string,
  productIds: string[],
  activeVendorId?: number | null,
): Promise<ProductsCoverageMap> {
  const numericProductIds = productIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (numericProductIds.length === 0) {
    return {};
  }

  const params = new URLSearchParams({
    cep,
    product_ids: Array.from(new Set(numericProductIds)).join(","),
  });

  if (activeVendorId && Number.isInteger(activeVendorId) && activeVendorId > 0) {
    params.set("vendor_id", String(activeVendorId));
  }

  const result = await wpRest<WpProductsCoverageResponse>(
    `/papelito/v1/coverage/products?${params.toString()}`,
    {
      revalidate: 30,
      tags: ["wp:coverage"],
    },
  );

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return Object.fromEntries(
    Object.entries(result.data).map(([productId, coverage]) => [
      productId,
      mapCoverage(coverage),
    ]),
  );
}
