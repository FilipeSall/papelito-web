import { beforeEach, describe, expect, it, vi } from "vitest";

const getSellerAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/vendor-session", () => ({
  getSellerAccessToken: () => getSellerAccessTokenMock(),
}));
vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

const SUMMARY = {
  mode: "gateways",
  gateways: [{ provider: "mercadopago", state: "ready", canReceive: true }],
  preference: { preferredProvider: "mercadopago", version: 2, explicit: true },
  mercadopagoAccount: null,
};

const PROFILE = { version: 3, profile: { companyName: "Loja", managingPartners: [{}], bankAccount: {} } };

describe("getVendorPaymentGateways", () => {
  beforeEach(() => {
    getSellerAccessTokenMock.mockReset();
    wpRestMock.mockReset();
  });

  it("devolve null sem sessão, sem chamar o WordPress", async () => {
    getSellerAccessTokenMock.mockResolvedValue(null);
    const { getVendorPaymentGateways } = await import("./get-vendor-payment-gateways");

    expect(await getVendorPaymentGateways()).toBeNull();
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("lê o resumo com tag própria e cache curto", async () => {
    getSellerAccessTokenMock.mockResolvedValue("token");
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: SUMMARY });
    const { getVendorPaymentGateways } = await import("./get-vendor-payment-gateways");

    const summary = await getVendorPaymentGateways();

    expect(summary?.mode).toBe("gateways");
    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/vendor/payment-gateways",
      expect.objectContaining({ tags: ["vendor-payment-gateways"], revalidate: expect.any(Number) }),
    );
  });

  it("falha ou resposta malformada vira null, nunca um resumo inventado", async () => {
    getSellerAccessTokenMock.mockResolvedValue("token");
    const { getVendorPaymentGateways } = await import("./get-vendor-payment-gateways");

    wpRestMock.mockResolvedValueOnce({ ok: false, status: 502, error: { code: "x", message: "x" } });
    expect(await getVendorPaymentGateways()).toBeNull();

    wpRestMock.mockResolvedValueOnce({ ok: true, status: 200, data: { gateways: "nada" } });
    expect(await getVendorPaymentGateways()).toBeNull();
  });
});

describe("getVendorFinancialProfile", () => {
  beforeEach(() => {
    getSellerAccessTokenMock.mockReset();
    wpRestMock.mockReset();
  });

  it("lê o perfil sem cache, porque a versão precisa estar viva para o PATCH", async () => {
    getSellerAccessTokenMock.mockResolvedValue("token");
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: PROFILE });
    const { getVendorFinancialProfile } = await import("./get-vendor-payment-gateways");

    expect((await getVendorFinancialProfile())?.version).toBe(3);
    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/vendor/financial-profile",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("devolve null quando não lê", async () => {
    getSellerAccessTokenMock.mockResolvedValue("token");
    wpRestMock.mockResolvedValue({ ok: false, status: 500, error: { code: "x", message: "x" } });
    const { getVendorFinancialProfile } = await import("./get-vendor-payment-gateways");

    expect(await getVendorFinancialProfile()).toBeNull();
  });
});
