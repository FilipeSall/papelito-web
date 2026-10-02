import { http, HttpResponse } from "msw";

/** Resposta REST do código do vendor para um item; identidade sempre vem do servidor. */
export function itemSettingsResponse(productId = 123, vendorCode: string | null = null) {
  return {
    product_id: productId,
    vendor_code: vendorCode,
    updated_at: vendorCode === null ? null : "2026-10-01 12:00:00",
  };
}

/** Handlers sem estado: o PATCH devolve o código aparado, como o WordPress faz; vazio vira `null`. */
export const vendorItemSettingsHandlers = [
  http.get("*/api/vendor/products/:productId/settings", ({ params }) =>
    HttpResponse.json(itemSettingsResponse(Number(params.productId))),
  ),
  http.patch("*/api/vendor/products/:productId/settings", async ({ params, request }) => {
    const body = await request.json() as { vendor_code: string | null };
    const code = body.vendor_code?.trim() || null;
    return HttpResponse.json(itemSettingsResponse(Number(params.productId), code));
  }),
];
