import { http, HttpResponse } from "msw";

export const couponsHandlers = [
  http.post("/api/coupons/apply", async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim().toUpperCase();

    if (code === "EXPIRADO") {
      return HttpResponse.json(
        {
          code: "papelito_coupon_expired",
          message: "Expirado.",
        },
        { status: 422 },
      );
    }

    if (code === "INVALID-JSON") {
      return new HttpResponse("invalid-json", { status: 200 });
    }

    return HttpResponse.json({
      ok: true,
      code: code || "PAPELITO10",
      discount_type: "fixed_cart",
      discount_value: 10,
      applied_product_ids: [1],
    });
  }),
];
