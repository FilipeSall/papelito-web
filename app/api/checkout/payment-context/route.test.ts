import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: () => getServerSessionMock() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: (...args: unknown[]) => wpRestMock(...args) }));

const CART = { items: [{ product_id: 1, qty: 2 }] };

function post(body: unknown) {
  return new Request("http://localhost/api/checkout/payment-context", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/checkout/payment-context", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    wpRestMock.mockReset();
    getServerSessionMock.mockResolvedValue({ user: { id: 1 }, accessToken: "buyer-token" });
  });

  it("backend sem a rota nova mantém o checkout Pagar.me direto", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 404, error: { code: "rest_no_route", message: "x" } });
    const { POST } = await import("./route");
    const response = await POST(post(CART));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ provider: "pagarme", flow: "direct", configurationVersion: "", fallbackReason: "" });
  });

  it("404 de domínio continua erro", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 404, error: { code: "papelito_checkout_vendor_not_found", message: "x" } });
    const { POST } = await import("./route");
    const response = await POST(post(CART));

    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("papelito_checkout_vendor_not_found");
  });

  it("contexto do Mercado Pago passa adiante", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: { provider: "mercadopago", flow: "redirect", configurationVersion: "cfg", fallbackReason: "" } });
    const { POST } = await import("./route");
    const response = await POST(post(CART));

    expect((await response.json()).provider).toBe("mercadopago");
  });
});
