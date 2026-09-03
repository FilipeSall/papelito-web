import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { VendorStockSummary, VendorStockType } from "../types/vendor-stock";

type WpSummaryResponse = {
  available?: number;
  coverage_percent?: number;
  eligible?: number;
  incomplete?: number;
  low_stock?: number;
  low_stock_threshold?: number;
  out_of_stock?: number;
  unconfigured?: number;
};

const EMPTY: VendorStockSummary = {
  available: 0,
  coveragePercent: 0,
  eligible: 0,
  incomplete: 0,
  lowStock: 0,
  lowStockThreshold: 5,
  outOfStock: 0,
  unconfigured: 0,
};

/**
 * Situação do catálogo do vendor para o resumo do topo.
 *
 * Falha fechada em zero: o resumo é orientação, e um número inventado na indisponibilidade do
 * WordPress mandaria o vendor atrás de produto que não existe.
 */
export async function getVendorStockSummary(type: VendorStockType): Promise<VendorStockSummary> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return EMPTY;
  }

  const result = await wpRest<WpSummaryResponse>(
    `/papelito/v1/vendor/me/stock/summary?type=${encodeURIComponent(type)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      revalidate: 30,
      tags: ["vendor-stock"],
    },
  );

  if (!result.ok) {
    return EMPTY;
  }

  return {
    available: Number(result.data.available) || 0,
    coveragePercent: Number(result.data.coverage_percent) || 0,
    eligible: Number(result.data.eligible) || 0,
    incomplete: Number(result.data.incomplete) || 0,
    lowStock: Number(result.data.low_stock) || 0,
    lowStockThreshold: Number(result.data.low_stock_threshold) || EMPTY.lowStockThreshold,
    outOfStock: Number(result.data.out_of_stock) || 0,
    unconfigured: Number(result.data.unconfigured) || 0,
  };
}
