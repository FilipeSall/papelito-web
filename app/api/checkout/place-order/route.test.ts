import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: () => getServerSessionMock() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: (...args: unknown[]) => wpRestMock(...args) }));
vi.mock("@/lib/server/app-url", () => ({ getAppBaseUrlOrUndefined: () => "https://papelito.example" }));

function post(body: unknown) {
  return new Request("http://localhost/api/checkout/place-order", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/checkout/place-order", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    wpRestMock.mockReset();
    getServerSessionMock.mockResolvedValue({ user: { id: 1 }, accessToken: "buyer-token", role: "customer" });
  });

  it("informa a base desta implantação para o retorno do Mercado Pago", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: { order_id: 1 } });
    const { POST } = await import("./route");

    await POST(post({ checkout_attempt_id: "a" }));

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/checkout/place-order",
      expect.objectContaining({ headers: expect.objectContaining({ "X-Papelito-Frontend-Base": "https://papelito.example" }) }),
    );
  });

  it("repassa o pedido em reconciliação para o comprador acompanhar", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "papelito_payment_attempt_reconciling", message: "Estamos confirmando.", data: { status: 409, orderId: 88 } },
    });
    const { POST } = await import("./route");

    const response = await POST(post({ checkout_attempt_id: "a" }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: "papelito_payment_attempt_reconciling", message: "Estamos confirmando.", orderId: 88 });
  });

  it("não expõe dados internos de outros erros", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 422,
      error: { code: "papelito_checkout_invalid_shipping", message: "Frete.", data: { status: 422, debug: "x" } },
    });
    const { POST } = await import("./route");

    const response = await POST(post({ checkout_attempt_id: "a" }));

    expect(await response.json()).toEqual({ code: "papelito_checkout_invalid_shipping", message: "Frete." });
  });

  it("preserva o pagamento novo do Mercado Pago", async () => {
    const payment = {
      method: "",
      state: "pending",
      provider: "mercadopago",
      flow: "redirect",
      paymentAttemptId: 5,
      configurationVersion: "v1",
      fallbackReason: "",
      redirectUrl: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1",
    };
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: { order_id: 77, order_number: "77", status: "pending", payment, totals: { totalCents: 1 } } });
    const { POST } = await import("./route");

    const response = await POST(post({ checkout_attempt_id: "a" }));

    expect(await response.json()).toMatchObject({ orderId: 77, payment });
  });
});
