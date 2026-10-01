import { parseProductPresentation } from "../types/product-presentation";

/** Busca a projeção pública pelo proxy e confirma que o texto pertence ao contexto pedido. */
export async function getProductPresentationClient(productId: string, vendorId: number, signal?: AbortSignal) {
  const response = await fetch("/api/catalog/products/" + encodeURIComponent(productId) + "/presentation?vendor_id=" + vendorId, {
    cache: "no-store", signal,
  });
  const data: unknown = await response.json();
  if (!response.ok) throw new Error("A descrição do vendor está indisponível no momento.");
  const presentation = parseProductPresentation(data, Number(productId), vendorId);
  if (!presentation) throw new Error("Apresentação de outro contexto descartada.");
  return presentation;
}
