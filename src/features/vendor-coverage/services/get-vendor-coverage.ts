import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { VendorCoverageSnapshot } from "../types/vendor-coverage";

type WpCoverageRange = {
  id?: number;
  max_cep?: string;
  max_cep_formatted?: string;
  min_cep?: string;
  min_cep_formatted?: string;
};

type WpCoverageResponse = {
  items?: WpCoverageRange[];
};

function mapRange(item: WpCoverageRange) {
  return {
    id: Number(item.id) || 0,
    maxCep: item.max_cep ?? "",
    maxCepFormatted: item.max_cep_formatted ?? item.max_cep ?? "",
    minCep: item.min_cep ?? "",
    minCepFormatted: item.min_cep_formatted ?? item.min_cep ?? "",
  };
}

export async function getVendorCoverage(): Promise<VendorCoverageSnapshot> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return { items: [] };
  }

  const result = await wpRest<WpCoverageResponse>("/papelito/v1/vendor/me/coverage-ranges", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    items: result.ok ? (result.data.items ?? []).map(mapRange).filter((item) => item.id > 0) : [],
  };
}
