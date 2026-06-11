import { http, HttpResponse } from "msw";

export const checkoutHandlers = [
  http.post("/api/checkout/place-order", async ({ request }) => {
    const body = (await request.json()) as { coupon_code?: string };

    if (body.coupon_code === "EXPIRADO") {
      return HttpResponse.json(
        {
          code: "papelito_coupon_expired",
          message: "Expirado.",
        },
        { status: 422 },
      );
    }

    if (body.coupon_code === "INVALIDO") {
      return HttpResponse.json(
        {
          message: "Resposta incompleta",
        },
        { status: 200 },
      );
    }

    return HttpResponse.json({
      orderId: 321,
      orderNumber: "321",
      status: "processing",
      payment: {
        method: "credit_card",
        state: "paid",
      },
    });
  }),
];
