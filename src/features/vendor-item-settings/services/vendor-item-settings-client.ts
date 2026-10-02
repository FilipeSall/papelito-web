import type { VendorItemSettings } from "../types/vendor-item-settings";

const INVALID_RESPONSE = "Resposta de código inválida.";

function parseItemSettings(value: unknown): VendorItemSettings {
  if (typeof value !== "object" || value === null) throw new Error(INVALID_RESPONSE);
  const row = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(row.product_id) || Number(row.product_id) <= 0 ||
    (row.vendor_code !== null && typeof row.vendor_code !== "string") ||
    (row.updated_at !== null && typeof row.updated_at !== "string")
  ) throw new Error(INVALID_RESPONSE);
  return { productId: Number(row.product_id), vendorCode: row.vendor_code, updatedAt: row.updated_at };
}

function readErrorMessage(data: unknown) {
  const message = typeof data === "object" && data !== null && "message" in data ? data.message : null;
  return typeof message === "string" ? message : "Não foi possível salvar o código.";
}

/**
 * Grava o código do vendor para o item pelo proxy autenticado; `null` remove a associação.
 * Devolve o valor normalizado pelo WordPress, que pode diferir do digitado (bordas e espaços).
 */
export async function saveVendorCode(
  productId: number, vendorCode: string | null, signal?: AbortSignal,
): Promise<VendorItemSettings> {
  const response = await fetch("/api/vendor/products/" + productId + "/settings", {
    method: "PATCH",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vendor_code: vendorCode }),
    signal,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readErrorMessage(data));
  const parsed = parseItemSettings(data);
  if (parsed.productId !== productId) throw new Error("Resposta de outro produto descartada.");
  return parsed;
}
