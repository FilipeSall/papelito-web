import { beforeEach, describe, expect, it, vi } from "vitest";

const requireVendorAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("../../_lib/require-vendor-session", () => ({
  requireVendorAccessToken: () => requireVendorAccessTokenMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

function post(body: unknown) {
  return new Request("http://localhost/api/vendor/mercadopago/disconnect", { body: JSON.stringify(body), method: "POST" });
}

describe("POST /api/vendor/mercadopago/disconnect", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
  });

  it("repassa a senha atual para a reautenticação do WordPress", async () => {
    wpRestMock.mockResolvedValue({ ok: true, data: { disconnected: true } });

    const { POST } = await import("./route");
    const response = await POST(post({ currentPassword: "senha-atual" }));

    expect(response.status).toBe(200);
    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/vendor/mercadopago/disconnect",
      expect.objectContaining({ json: { currentPassword: "senha-atual" }, method: "POST" }),
    );
  });

  it("senha recusada mantém o status do WordPress", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 403,
      error: { code: "papelito_reauthentication_failed", message: "Não foi possível confirmar a senha atual." },
    });

    const { POST } = await import("./route");
    const response = await POST(post({ currentPassword: 123 }));

    expect(response.status).toBe(403);
    expect(wpRestMock.mock.calls[0][1]).toEqual(expect.objectContaining({ json: { currentPassword: "" } }));
  });
});
