import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminApiSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("@/lib/server/admin-api-auth", () => ({ getAdminApiSession: () => getAdminApiSessionMock() }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: (...args: unknown[]) => wpRestMock(...args) }));

const params = (id: string) => ({ params: Promise.resolve({ id }) });

function post(body: unknown) {
  return new Request("http://localhost/api/admin/vendors/42/mercadopago-identity", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/admin/vendors/[id]/mercadopago-identity", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    wpRestMock.mockReset();
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
  });

  it("repassa a conta conferida junto com o resultado e a evidência", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: {} });
    const { POST } = await import("./route");

    await POST(post({ status: "verified", evidenceRef: "CH-1", accountId: 9, vendorId: 1 }), params("42"));

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/admin/vendors/42/mercadopago/identity",
      expect.objectContaining({ json: { status: "verified", evidenceRef: "CH-1", accountId: 9 } }),
    );
  });

  it("conta trocada no meio mantém o 409", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 409, error: { code: "papelito_payment_identity_account_changed", message: "x" } });
    const { POST } = await import("./route");
    const response = await POST(post({ status: "verified", evidenceRef: "CH-1", accountId: 8 }), params("42"));

    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("papelito_payment_identity_account_changed");
  });
});
