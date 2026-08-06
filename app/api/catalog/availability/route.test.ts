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
      new Request(
        "http://localhost:3000/api/catalog/availability?productIds=11760,11762",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "no_vendor",
      products: {
        "11760": { available: false, stockQty: 0 },
        "11762": { available: false, stockQty: 0 },
      },
    });
    expect(getCoverageMock).not.toHaveBeenCalled();
  });

  it("reports missing_cep when the logged customer has no CEP on the account", async () => {
    getAccountCoverageCepContextMock.mockResolvedValue({
      isAuthenticated: true,
      cep: null,
    });
    getActiveVendorMock.mockResolvedValue({
      ok: false,
      error: {
        reason: "missing_cep",
        message: "Cadastre um CEP na sua conta para escolher um vendor.",
      },
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/catalog/availability?productIds=11760",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "missing_cep",
      products: {},
    });
    expect(getCoverageMock).not.toHaveBeenCalled();
  });

  it("allows an anonymous visitor to check one product with a temporary CEP", async () => {
    getServerSessionMock.mockResolvedValue(null);
    getCoverageMock.mockResolvedValue({
      "11760": {
        hasCoverage: true,
        bestVendor: {
          vendor_id: 101,
          qty: 8,
        },
        alternatives: [],
      },
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/catalog/availability?productIds=11760&cep=01310-930",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      products: {
        "11760": { available: true, stockQty: 1 },
      },
    });
    expect(getCoverageMock).toHaveBeenCalledWith("01310930", ["11760"]);
  });

  it("rejects public availability requests with more than one product", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/catalog/availability?productIds=11760,11762&cep=01310930",
      ),
    );

    expect(response.status).toBe(400);
    expect(getCoverageMock).not.toHaveBeenCalled();
  });

  it("rejects a public availability request with an invalid CEP", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/catalog/availability?productIds=11760&cep=123",
      ),
    );

    expect(response.status).toBe(400);
    expect(getCoverageMock).not.toHaveBeenCalled();
  });

  it("rate limits repeated public availability requests", async () => {
    getServerSessionMock.mockResolvedValue(null);
    getCoverageMock.mockResolvedValue({
      "11760": {
        hasCoverage: true,
        bestVendor: { vendor_id: 101, qty: 8 },
        alternatives: [],
      },
    });

    const { GET } = await import("./route");
    const requestUrl =
      "http://localhost:3000/api/catalog/availability?productIds=11760&cep=01310930";

    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect((await GET(new Request(requestUrl))).status).toBe(200);
    }

    expect((await GET(new Request(requestUrl))).status).toBe(429);
  });

  it("returns unavailable when public coverage lookup fails", async () => {
    getServerSessionMock.mockResolvedValue(null);
    getCoverageMock.mockRejectedValue(new Error("coverage failed"));

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/catalog/availability?productIds=11760&cep=01310930",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "unavailable",
      products: {},
    });
  });
});
