import { cache } from "react";
import { getProductDetail } from "../services/get-product-detail";

const getCachedProductDetail = cache(async (id: string) => getProductDetail(id));

/**
 * Hook server-side para obter os dados do produto por `id`.
 *
 * Mantém cache por chamada para evitar leituras duplicadas do mock
 * durante o mesmo ciclo de renderização server-side.
 */
export async function useProductDetail(id: string) {
  return getCachedProductDetail(id);
}
