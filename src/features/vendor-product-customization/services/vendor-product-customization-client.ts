import type { VendorProductCustomization } from "../types/vendor-product-customization";

function parseCustomization(value: unknown): VendorProductCustomization {
  if (typeof value !== "object" || value === null) throw new Error("Resposta de descrição inválida.");
  const row = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(row.product_id) || Number(row.product_id) <= 0 ||
    !Number.isSafeInteger(row.vendor_id) || Number(row.vendor_id) <= 0 ||
    typeof row.canonical_description !== "string" ||
    (row.vendor_description !== null && typeof row.vendor_description !== "string") ||
    typeof row.vendor_description_enabled !== "boolean" ||
    typeof row.effective_description !== "string" ||
    (row.description_source !== "papelito" && row.description_source !== "vendor") ||
    typeof row.can_edit !== "boolean" ||
    (row.updated_at !== null && typeof row.updated_at !== "string")
  ) throw new Error("Resposta de descrição inválida.");
  return {
    productId: Number(row.product_id), vendorId: Number(row.vendor_id),
    canonicalDescription: row.canonical_description, vendorDescription: row.vendor_description,
    vendorDescriptionEnabled: row.vendor_description_enabled,
    effectiveDescription: row.effective_description, descriptionSource: row.description_source,
    canEdit: row.can_edit, updatedAt: row.updated_at,
  };
}

type CustomizationInput = { description: string; use_vendor_description: boolean };

async function customizationRequest(
  productId: number, method: "GET" | "PUT" | "DELETE", input?: CustomizationInput, signal?: AbortSignal,
): Promise<VendorProductCustomization> {
  const response = await fetch("/api/vendor/products/" + productId + "/customization", {
    method, cache: "no-store", headers: { "Content-Type": "application/json" },
    ...(method === "PUT" ? { body: JSON.stringify(input) } : {}), signal,
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const message = typeof data === "object" && data !== null && "message" in data ? data.message : null;
    throw new Error(typeof message === "string" ? message : "Não foi possível acessar a descrição.");
  }
  const parsed = parseCustomization(data);
  if (parsed.productId !== productId) throw new Error("Resposta de outro produto descartada.");
  return parsed;
}

/** Carrega a referência e personalização pelo proxy autenticado. */
export function getVendorProductCustomization(productId: number, signal?: AbortSignal) {
  return customizationRequest(productId, "GET", undefined, signal);
}

/**
 * Salva o texto em parágrafos e a escolha de exibi-lo na loja.
 * Com `useVendorDescription` falso o texto fica guardado e a loja mostra o da Papelito.
 */
export function saveVendorProductCustomization(
  productId: number, description: string, useVendorDescription: boolean, signal?: AbortSignal,
) {
  return customizationRequest(productId, "PUT", { description, use_vendor_description: useVendorDescription }, signal);
}

/** Apaga o texto guardado do vendor e recebe o canônico atual, sem gravar uma cópia. */
export function restoreVendorProductDescription(productId: number, signal?: AbortSignal) {
  return customizationRequest(productId, "DELETE", undefined, signal);
}
