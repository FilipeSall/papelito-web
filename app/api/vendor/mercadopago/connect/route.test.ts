import { beforeEach, describe, expect, it, vi } from "vitest";

const requireVendorAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("../../_lib/require-vendor-session", () => ({
  requireVendorAccessToken: () => requireVendorAccessTokenMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

const AUTH_URL = "https://auth.mercadopago.com.br/authorization?client_id=1&state=s";

describe("POST /api/vendor/mercadopago/connect", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
  });

  it("gera o binding da sessão em cookie httpOnly e devolve a URL de autorização", async () => {
    wpRestMock.mockResolvedValue({ ok: true, data: { authorizationUrl: AUTH_URL, expiresIn: 600 } });

    const { POST } = await import("./route");
    const response = await POST();
    const binding = (wpRestMock.mock.calls[0][1] as { json: { binding: string } }).json.binding;
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authorizationUrl: AUTH_URL });
    expect(binding.length).toBeGreaterThanOrEqual(43);
    expect(cookie).toContain(`papelito_mp_oauth_binding=${binding}`);
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie).toContain("Path=/api/vendor/mercadopago");
  });

  it("não devolve URL de autorização fora do domínio do Mercado Pago", async () => {
    wpRestMock.mockResolvedValue({ ok: true, data: { authorizationUrl: "https://evil.example/authorization" } });

    const { POST } = await import("./route");
    const response = await POST();

    expect(response.status).toBe(502);
  });

  it("exige sessão de vendor", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ error: "Nao autenticado.", status: 401 });

    const { POST } = await import("./route");
    const response = await POST();

    expect(response.status).toBe(401);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("repassa a recusa do WordPress com o código", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 403,
      error: { code: "papelito_payment_gateways_disabled", message: "Ainda não liberado" },
    });

    const { POST } = await import("./route");
    const response = await POST();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ code: "papelito_payment_gateways_disabled", message: "Ainda não liberado" });
  });
});
