import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../../../../test/msw/server";
import { expocannabisClient } from "./expocannabis-client";

describe("expocannabisClient", () => {
  it("consulta o CNPJ e devolve a loja", async () => {
    server.use(
      http.post("*/api/expocannabis/buyers/lookup", () =>
        HttpResponse.json({
          cnpj: "11222333000181",
          legalName: "Loja LTDA",
          tradeName: "Loja",
          address: { cep: "01001000", street: "Praça da Sé", city: "São Paulo", state: "SP", number: "", neighborhood: "" },
          companyId: null,
        }),
      ),
    );

    const result = await expocannabisClient.lookupBuyer("11.222.333/0001-81");

    expect(result).toMatchObject({ ok: true, data: { tradeName: "Loja", companyId: null } });
  });

  it("devolve código e mensagem do erro sem lançar", async () => {
    server.use(
      http.post("*/api/expocannabis/buyers/lookup", () =>
        HttpResponse.json({ code: "papelito_event_cnpj_inactive", message: "inativo" }, { status: 422 }),
      ),
    );

    const result = await expocannabisClient.lookupBuyer("11222333000181");

    expect(result).toEqual({ ok: false, status: 422, code: "papelito_event_cnpj_inactive", message: "inativo" });
  });

  it("falha de rede vira erro de rede", async () => {
    server.use(http.post("*/api/expocannabis/buyers/lookup", () => HttpResponse.error()));

    const result = await expocannabisClient.lookupBuyer("11222333000181");

    expect(result).toMatchObject({ ok: false, code: "network_error" });
  });

  it("cria o pedido com a chave do atendimento e devolve os dados do erro", async () => {
    let key: string | null = null;
    server.use(
      http.post("*/api/expocannabis/orders", ({ request }) => {
        key = request.headers.get("Idempotency-Key");
        return HttpResponse.json(
          { code: "papelito_event_quote_changed", message: "mudou", data: { status: 409, quote: { totalCents: 1 } } },
          { status: 409 },
        );
      }),
    );

    const result = await expocannabisClient.createOrder({
      checkoutAttemptId: "chk-1",
      companyId: 30,
      buyerUserId: 40,
      items: [],
      kits: 0,
      delivery: { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
      quoteFingerprint: "x",
      method: "card",
      terminalId: "NEWLAND_N950__N950NCD600451364",
    });

    expect(key).toBe("chk-1");
    expect(result).toMatchObject({ ok: false, code: "papelito_event_quote_changed", data: { quote: { totalCents: 1 } } });
  });

  it("resposta malformada vira erro", async () => {
    server.use(http.get("*/api/expocannabis/orders/501/status", () => HttpResponse.json({ state: "lixo" })));

    const result = await expocannabisClient.orderStatus(501);

    expect(result).toMatchObject({ ok: false, code: "papelito_invalid_response" });
  });

  it("lê o status do pedido", async () => {
    server.use(
      http.get("*/api/expocannabis/orders/501/status", () =>
        HttpResponse.json({ orderId: 501, orderNumber: "501", state: "paid", detail: "", totalCents: 10, method: "pix" }),
      ),
    );

    const result = await expocannabisClient.orderStatus(501);

    expect(result).toMatchObject({ ok: true, data: { state: "paid" } });
  });
});
