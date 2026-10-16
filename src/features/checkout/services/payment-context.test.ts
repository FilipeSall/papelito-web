import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../../../../test/msw/server";
import { getPaymentContext } from "./payment-context";

const input = {
  expectedCompanyId: 10,
  items: [{ productId: 1, qty: 2, vendorId: 7, vendorName: "Loja Centro" }],
};

describe("getPaymentContext", () => {
  it("envia empresa e itens em snake_case e devolve o contexto", async () => {
    let body: unknown = null;
    server.use(
      http.post("/api/checkout/payment-context", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ provider: "mercadopago", flow: "redirect", configurationVersion: "v1", fallbackReason: "" });
      }),
    );

    await expect(getPaymentContext(input)).resolves.toEqual({
      ok: true,
      context: { provider: "mercadopago", flow: "redirect", configurationVersion: "v1", fallbackReason: "" },
    });
    expect(body).toEqual({
      expected_company_id: 10,
      items: [{ product_id: 1, qty: 2, vendor_id: 7, vendor_name: "Loja Centro" }],
    });
  });

  it("mostra a mensagem do catálogo quando não há gateway", async () => {
    server.use(
      http.post("/api/checkout/payment-context", () =>
        HttpResponse.json({ code: "papelito_payment_no_gateway_available", message: "raw" }, { status: 409 }),
      ),
    );

    await expect(getPaymentContext(input)).resolves.toEqual({
      ok: false,
      error: {
        code: "papelito_payment_no_gateway_available",
        message: "Nenhuma forma de pagamento está disponível para esta loja agora.",
        status: 409,
      },
    });
  });

  it("vendor suspenso usa a mensagem do catálogo", async () => {
    server.use(
      http.post("/api/checkout/payment-context", () =>
        HttpResponse.json({ code: "papelito_payment_vendor_suspended" }, { status: 409 }),
      ),
    );

    await expect(getPaymentContext(input)).resolves.toMatchObject({
      ok: false,
      error: { message: "Esta loja está sem pagamentos disponíveis no momento." },
    });
  });

  it("contexto incoerente não é aceito", async () => {
    server.use(
      http.post("/api/checkout/payment-context", () =>
        HttpResponse.json({ provider: "mercadopago", flow: "direct", configurationVersion: "v1" }),
      ),
    );

    await expect(getPaymentContext(input)).resolves.toMatchObject({ ok: false, error: { code: "papelito_invalid_response" } });
  });

  it("falha de rede não inventa gateway", async () => {
    server.use(http.post("/api/checkout/payment-context", () => HttpResponse.error()));

    await expect(getPaymentContext(input)).resolves.toMatchObject({ ok: false, error: { code: "papelito_network_error" } });
  });
});
