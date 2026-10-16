import { beforeEach, describe, expect, it, vi } from "vitest";

const wpRestMock = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

const SUMMARY = {
  mode: "gateways",
  gateways: [],
  preference: { preferredProvider: "pagarme", version: 1, explicit: false },
  mercadopagoAccount: { collectorId: "123", identityStatus: "pending", status: "active" },
};

describe("getAdminVendorPaymentGateways", () => {
  beforeEach(() => wpRestMock.mockReset());

  it("lê o espelho administrativo sem cache, para refletir a conferência recém-gravada", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: SUMMARY });
    const { getAdminVendorPaymentGateways } = await import("./get-admin-vendor-payment-gateways");

    const summary = await getAdminVendorPaymentGateways("admin-token", 42);

    expect(summary?.mercadopagoAccount?.collectorId).toBe("123");
    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/admin/vendors/42/payment-gateways",
      expect.objectContaining({ cache: "no-store", headers: { Authorization: "Bearer admin-token" } }),
    );
  });

  it("devolve null em falha ou resposta malformada", async () => {
    const { getAdminVendorPaymentGateways } = await import("./get-admin-vendor-payment-gateways");

    wpRestMock.mockResolvedValueOnce({ ok: false, status: 403, error: { code: "x", message: "x" } });
    expect(await getAdminVendorPaymentGateways("t", 1)).toBeNull();

    wpRestMock.mockResolvedValueOnce({ ok: true, status: 200, data: {} });
    expect(await getAdminVendorPaymentGateways("t", 1)).toBeNull();
  });
});
