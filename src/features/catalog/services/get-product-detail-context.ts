import "server-only";
import type { ActiveVendorResult } from "@/features/active-vendor/server";
import { createRegionBlock } from "../types/region-block";
import { getAccountCoverageCepContext } from "./get-account-coverage-cep";
import { getCoverage } from "./get-coverage";
import { getProductPresentation } from "./get-product-presentation";

async function getDetailCoverage(productId: string, context: ActiveVendorResult | null) {
  if (!context?.ok) {
    const reason = context && !context.ok ? context.error.reason : null;
    const kind = reason === "no_vendor_available" ? "no_vendor" : null;
    const regionBlock = reason === "missing_cep" ? createRegionBlock("missing_cep") : null;
    return { selectedVendorStockQty: null, regionBlock: kind ? createRegionBlock(kind) : regionBlock };
  }
  const { cep } = await getAccountCoverageCepContext();
  if (!cep) return { selectedVendorStockQty: null, regionBlock: createRegionBlock("missing_cep") };
  const coverage = await getCoverage(cep, [productId], context.vendor.vendorId).catch(() => null);
  return {
    selectedVendorStockQty: coverage?.[productId]?.bestVendor?.qty ?? null,
    regionBlock: coverage?.[productId]?.hasCoverage === false ? createRegionBlock("no_product_coverage") : null,
  };
}

/** Dados contextuais do detalhe; preserva leitura fresca do vendor e os contratos de cobertura. */
export async function getProductDetailContext(productId: string, context: ActiveVendorResult | null, loadPresentation: boolean) {
  const presentation = loadPresentation && context?.ok ? getProductPresentation(productId, context.vendor.vendorId).catch(() => null) : Promise.resolve(null);
  const [initialPresentation, coverage] = await Promise.all([presentation, getDetailCoverage(productId, context)]);
  return { initialPresentation, ...coverage };
}
