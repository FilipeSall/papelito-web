import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

/**
 * Descrição que a loja do seller logado mostra no produto, lida da visão privada de gestão.
 * A autoridade é o WordPress, com o token da própria sessão e sem cache; `null` em
 * falha, papel inadequado ou resposta de outro produto, e o cliente tenta de novo.
 */
export async function getOwnProductDescription(productId: string, accessToken: string | undefined) {
  const id = Number(productId);
  if (!accessToken || !Number.isSafeInteger(id) || id <= 0) return null;
  const result = await wpRest<unknown>("/papelito/v1/vendor/me/products/" + id + "/customization", {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!result.ok || typeof result.data !== "object" || result.data === null) return null;
  const view = result.data as Record<string, unknown>;
  return view.product_id === id && typeof view.effective_description === "string" ? view.effective_description : null;
}
