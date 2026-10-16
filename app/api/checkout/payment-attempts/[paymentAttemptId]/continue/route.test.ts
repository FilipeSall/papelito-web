import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: () => getServerSessionMock() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: (...args: unknown[]) => wpRestMock(...args) }));

function post(body: unknown) {
  return new Request("http://localhost/api/checkout/payment-attempts/12/continue", { method: "POST", body: JSON.stringify(body) });
}

const params = (paymentAttemptId: string) => ({ params: Promise.resolve({ paymentAttemptId }) });

describe("POST /api/checkout/payment-attempts/[id]/continue", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    wpRestMock.mockReset();
    getServerSessionMock.mockResolvedValue({ user: { id: 1 }, accessToken: "buyer-token" });
  });

  it("repassa só empresa, versão e pagamento", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: { order_id: 9 } });
    const { POST } = await import("./route");

    await POST(post({ expectedCompanyId: 7, configurationVersion: "v", payment: { method: "pix" }, items: [{ product_id: 1 }], vendorId: 3 }), params("12"));

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/checkout/payment-attempts/12/continue",
      expect.objectContaining({ json: { expectedCompanyId: 7, configurationVersion: "v", payment: { method: "pix" } } }),
    );
  });

  it("identificador inválido não chega ao WordPress", async () => {
    const { POST } = await import("./route");
    const response = await POST(post({}), params("../1"));

    expect(response.status).toBe(404);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("conflito de configuração mantém o 409 e o código", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 409, error: { code: "papelito_payment_configuration_stale", message: "x" } });
    const { POST } = await import("./route");
    const response = await POST(post({}), params("12"));

    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("papelito_payment_configuration_stale");
  });
});

describe("POST /api/checkout/payment-attempts/[id]/continue — versão nova", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    wpRestMock.mockReset();
    getServerSessionMock.mockResolvedValue({ user: { id: 1 }, accessToken: "buyer-token" });
  });

  it("repassa a versão nova da configuração obsoleta", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "papelito_payment_configuration_stale", message: "x", data: { status: 409, configurationVersion: "cfg-3" } },
    });
    const { POST } = await import("./route");
    const response = await POST(post({}), params("12"));

    expect(await response.json()).toMatchObject({ code: "papelito_payment_configuration_stale", configurationVersion: "cfg-3" });
  });
});
