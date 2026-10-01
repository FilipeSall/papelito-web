import type { DescriptionSource } from "@/features/vendor-product-customization/types/vendor-product-customization";

/** Projeção pública do produto; não contém dados privados de gestão. */
export interface ProductPresentation {
  productId: number;
  vendorId: number | null;
  description: string;
  summary: string;
  descriptionSource: DescriptionSource;
}

/** Valida o contrato e o par solicitado antes de aplicar qualquer texto à interface. */
export function parseProductPresentation(
  value: unknown, productId: number, vendorId: number | null,
): ProductPresentation | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (
    row.product_id !== productId || row.vendor_id !== vendorId ||
    typeof row.description !== "string" || typeof row.summary !== "string" ||
    (row.description_source !== "papelito" && row.description_source !== "vendor") ||
    (vendorId === null && row.description_source === "vendor")
  ) return null;
  return {
    productId, vendorId, description: row.description,
    summary: row.summary, descriptionSource: row.description_source,
  };
}
