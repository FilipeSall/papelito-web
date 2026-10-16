import { NextRequest } from "next/server";
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

const BINDING = "binding-value-0123456789abcdefghijklmnopqrstuvwxyz";
const CALLBACK_URL = "https://papelito.example/api/vendor/mercadopago/callback";
const SETTINGS_PATH = "/vendor/configuracoes";

function callback(query: string, cookie = `papelito_mp_oauth_binding=${BINDING}`) {
  return new NextRequest(`${CALLBACK_URL}?${query}`, { headers: cookie ? { cookie } : {} });
}

function redirectTarget(response: Response) {
  return new URL(response.headers.get("location") ?? "");
}

describe("GET /api/vendor/mercadopago/callback", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
  });

  it("repassa code, state e binding ao WordPress com a sessão do vendor", async () => {
    wpRestMock.mockResolvedValue({ ok: true, data: { account: { collectorId: "900001" } } });

    const { GET } = await import("./route");
    const response = await GET(callback("code=TG-abc&state=state-xyz"));

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/mercadopago/oauth/callback",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer vendor-token" },
        json: { code: "TG-abc", state: "state-xyz", binding: BINDING },
      }),
    );
    expect(redirectTarget(response).pathname).toBe(SETTINGS_PATH);
    expect(redirectTarget(response).searchParams.get("mercadopago")).toBe("connected");
  });

  it("não deixa code nem state na URL de destino e bloqueia cache e referrer", async () => {
    wpRestMock.mockResolvedValue({ ok: true, data: {} });

    const { GET } = await import("./route");
    const response = await GET(callback("code=TG-abc&state=state-xyz"));

    expect(response.headers.get("location")).not.toContain("TG-abc");
    expect(response.headers.get("location")).not.toContain("state-xyz");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("set-cookie")).toContain("papelito_mp_oauth_binding=;");
  });

  it("sem sessão pede para reiniciar sem consumir o código", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ error: "Nao autenticado.", status: 401 });

    const { GET } = await import("./route");
    const response = await GET(callback("code=TG-abc&state=state-xyz"));

    expect(wpRestMock).not.toHaveBeenCalled();
    expect(redirectTarget(response).searchParams.get("mercadopago")).toBe("session_required");
  });

  it("sem o cookie da sessão iniciadora não consome o código", async () => {
    const { GET } = await import("./route");
    const response = await GET(callback("code=TG-abc&state=state-xyz", ""));

    expect(wpRestMock).not.toHaveBeenCalled();
    expect(redirectTarget(response).searchParams.get("mercadopago")).toBe("session_required");
  });

  it("autorização negada volta ao painel sem chamar o WordPress", async () => {
    const { GET } = await import("./route");
    const response = await GET(callback("error=access_denied&state=state-xyz"));

    expect(wpRestMock).not.toHaveBeenCalled();
    expect(redirectTarget(response).searchParams.get("mercadopago")).toBe("denied");
  });

  it("recusa do WordPress volta com o código do motivo, sem mensagem crua", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 400,
      error: { code: "papelito_mercadopago_oauth_state_invalid", message: "Esta conexão expirou" },
    });

    const { GET } = await import("./route");
    const target = redirectTarget(await GET(callback("code=TG-abc&state=state-xyz")));

    expect(target.searchParams.get("mercadopago")).toBe("error");
    expect(target.searchParams.get("reason")).toBe("papelito_mercadopago_oauth_state_invalid");
  });
});
