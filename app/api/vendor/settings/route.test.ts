import { beforeEach, describe, expect, it, vi } from "vitest";

const requireVendorAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("../_lib/require-vendor-session", () => ({
  requireVendorAccessToken: () => requireVendorAccessTokenMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const SETTINGS_URL = "http://localhost/api/vendor/settings";
const WP_SETTINGS_PATH = "/papelito/v1/vendor/me/settings";

function put(body: unknown) {
  return new Request(SETTINGS_URL, { body: JSON.stringify(body), method: "PUT" });
}

describe("PUT /api/vendor/settings", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
  });

  it("repassa só os Correios quando é só isso que a tela mudou", async () => {
    wpRestMock.mockResolvedValue({ ok: true, data: { correios_enabled: false, correios_locked: false } });

    const { PUT } = await import("./route");
    const response = await PUT(put({ correios_enabled: false }));

    expect(response.status).toBe(200);
    expect(wpRestMock).toHaveBeenCalledWith(
      WP_SETTINGS_PATH,
      expect.objectContaining({ json: { correios_enabled: false }, method: "PUT" }),
    );
    expect(await response.json()).toEqual({ correios_enabled: false, correios_locked: false });
  });

  it("normaliza a Braspress que volta quando desligar os Correios a ligou", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: {
        braspress: {
          config: { origin_cep: "01310930", sender_cnpj: "12345678000195" },
          configuration_version: 4,
          configured: true,
          credentials_configured: true,
          enabled: true,
          status: "invalid_credentials",
        },
        braspress_enabled: true,
        correios_enabled: false,
        correios_locked: false,
      },
    });

    const { PUT } = await import("./route");
    const body = await (await PUT(put({ correios_enabled: false }))).json();

    expect(body.braspress).toEqual({
      config: { originCep: "01310930", senderCnpj: "12345678000195" },
      configurationVersion: 4,
      configured: true,
      credentialsConfigured: true,
      enabled: true,
      provider: "braspress",
      status: "invalid_credentials",
    });
  });

  it("continua aceitando só o prazo, sem enviar os Correios", async () => {
    wpRestMock.mockResolvedValue({ ok: true, data: {} });

    const { PUT } = await import("./route");
    await PUT(put({ shipping_lead_time_days: 3 }));

    expect(wpRestMock).toHaveBeenCalledWith(
      WP_SETTINGS_PATH,
      expect.objectContaining({ json: { shipping_lead_time_days: 3 } }),
    );
  });

  it.each([
    ["corpo vazio", {}],
    ["Correios como texto", { correios_enabled: "false" }],
    ["prazo fora da faixa", { shipping_lead_time_days: 31 }],
  ])("recusa %s sem chamar o WordPress", async (_label, body) => {
    const { PUT } = await import("./route");
    const response = await PUT(put(body));

    expect(response.status).toBe(400);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("devolve o código da regra quando o WordPress recusa desligar os Correios", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 422,
      error: { code: "papelito_vendor_correios_locked", message: "Configure a Braspress." },
    });

    const { PUT } = await import("./route");
    const response = await PUT(put({ correios_enabled: false }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      code: "papelito_vendor_correios_locked",
      message: "Configure a Braspress.",
    });
  });
});
