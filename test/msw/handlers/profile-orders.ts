import { http, HttpResponse } from "msw";

/**
 * Pedido cujo recibo o WordPress recusa enviar por falta de e-mail verificado.
 */
export const RECEIPT_EMAIL_UNAVAILABLE_ORDER_ID = "422";

/**
 * Pedido cujo envio de recibo estourou o limite de solicitações.
 */
export const RECEIPT_EMAIL_RATE_LIMITED_ORDER_ID = "429";

export const PROFILE_ORDER_DETAIL_ID = "42";

export const profileOrdersHandlers = [
  http.get("http://localhost:8080/wp-json/papelito/v1/profile/me/orders/:id", ({ params }) => {
    if (String(params.id) !== PROFILE_ORDER_DETAIL_ID) {
      return HttpResponse.json({ code: "papelito_profile_order_not_found" }, { status: 404 });
    }

    return HttpResponse.json({
      created_at: "2026-07-03 09:00:00",
      id: Number(params.id),
      items: [],
      logistics: { shipments: [], status: "not_started" },
      order_number: "42",
      payment: { state: "paid" },
      payment_method: "PIX",
      receipt: {
        available: true,
        issued_at: "03/07/2026 09:31",
        number: "PPL-2026-000482",
      },
      shipping_address: {},
      shipping_total: 0,
      subtotal: 0,
      total: 0,
      vendor_status: "aguardando_envio",
    });
  }),
  http.get("/api/profile/orders/:id/receipt", ({ params }) =>
    HttpResponse.arrayBuffer(new TextEncoder().encode("%PDF-1.4 recibo").buffer as ArrayBuffer, {
      headers: {
        "Content-Disposition": `attachment; filename="recibo-pedido-${String(params.id)}.pdf"`,
        "Content-Type": "application/pdf",
      },
    }),
  ),
  http.post("/api/profile/orders/:id/receipt/email", ({ params }) => {
    if (String(params.id) === RECEIPT_EMAIL_UNAVAILABLE_ORDER_ID) {
      return HttpResponse.json(
        {
          code: "papelito_receipt_email_unavailable",
          message: "Nao ha e-mail verificado para o envio.",
        },
        { status: 422 },
      );
    }

    if (String(params.id) === RECEIPT_EMAIL_RATE_LIMITED_ORDER_ID) {
      return HttpResponse.json(
        {
          code: "papelito_receipt_email_rate_limited",
          message: "Aguarde antes de solicitar outro envio.",
        },
        { status: 429 },
      );
    }

    return HttpResponse.json({ ok: true });
  }),
];
