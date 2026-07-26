import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const getAccountCoverageCepContextMock = vi.fn();
const getActiveVendorMock = vi.fn();
const getCoverageMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (callback: (...args: Array<never>) => unknown) => callback,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/features/active-vendor/server", () => ({
  getActiveVendor: () => getActiveVendorMock(),
}));

vi.mock("@/features/catalog/services/get-account-coverage-cep", () => ({
  getAccountCoverageCepContext: () => getAccountCoverageCepContextMock(),
}));

vi.mock("@/features/catalog/services/get-coverage", () => ({
  getCoverage: (...args: unknown[]) => getCoverageMock(...args),
}));

describe("GET /api/catalog/availability", () => {
  beforeEach(() => {
    vi.resetModules();
    getServerSessionMock.mockReset();
    getAccountCoverageCepContextMock.mockReset();
    getActiveVendorMock.mockReset();
    getCoverageMock.mockReset();

    getServerSessionMock.mockResolvedValue({
      accessToken: "customer-token",
      role: "customer",
      user: { id: "42", email: "customer@example.com" },
    });
    getAccountCoverageCepContextMock.mockResolvedValue({
      isAuthenticated: true,
      cep: "70879060",
    });
  });

  it("marks every product unavailable when no vendor serves the customer's region", async () => {
    getActiveVendorMock.mockResolvedValue({
      ok: false,
      error: {
        reason: "no_vendor_available",
        message: "Nenhum vendor atende sua região no momento.",
      },
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost:3000/api/catalog/availability?productIds=11760,11762"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      products: {
        "11760": { available: false, stockQty: 0 },
        "11762": { available: false, stockQty: 0 },
      },
    });
    expect(getCoverageMock).not.toHaveBeenCalled();
  });
});
