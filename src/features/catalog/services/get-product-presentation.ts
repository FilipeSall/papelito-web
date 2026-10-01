import "server-only";
import { wpRest } from "@/lib/server/wp-rest";
import { parseProductPresentation } from "../types/product-presentation";

/** Lê a composição atual sem cache persistente; falha técnica não é ausência de override. */
export async function getProductPresentation(productId: string | number, vendorId: number | null = null) {
  const id = Number(productId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Produto inválido.");
  const query = vendorId === null ? "" : "?vendor_id=" + vendorId;
  const result = await wpRest<unknown>("/papelito/v1/products/" + id + "/presentation" + query);
  if (!result.ok) throw new Error(result.error.message);
  const presentation = parseProductPresentation(result.data, id, vendorId);
  if (!presentation) throw new Error("Apresentação de outro contexto descartada.");
  return presentation;
}
