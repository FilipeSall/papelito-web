import { http, HttpResponse } from "msw";

/** Resposta REST de gestão para testes; identidade sempre vem do servidor. */
export function customizationResponse(productId = 123, description: string | null = null, enabled = description !== null) {
  const custom = description !== null && enabled;
  return {
    product_id: productId,
    vendor_id: 45,
    canonical_description: "<p>Descrição Papelito.</p>",
    vendor_description: description,
    vendor_description_enabled: custom,
    effective_description: custom ? description : "<p>Descrição Papelito.</p>",
    description_source: custom ? "vendor" : "papelito",
    can_edit: true,
    updated_at: description === null ? null : "2026-10-01 12:00:00",
  };
}

/** Handlers sem estado compartilhado para edição e restauração de descrições. */
export const vendorProductCustomizationHandlers = [
  http.get("*/api/vendor/products/:productId/customization", ({ params }) =>
    HttpResponse.json(customizationResponse(Number(params.productId))),
  ),
  http.put("*/api/vendor/products/:productId/customization", async ({ params, request }) => {
    const body = await request.json() as { description: string; use_vendor_description?: boolean };
    return HttpResponse.json(customizationResponse(Number(params.productId), body.description, body.use_vendor_description ?? true));
  }),
  http.delete("*/api/vendor/products/:productId/customization", ({ params }) =>
    HttpResponse.json(customizationResponse(Number(params.productId))),
  ),
];
