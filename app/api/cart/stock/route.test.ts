import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const getAccountCoverageCepContextMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/features/catalog/services/get-account-coverage-cep", () => ({
  getAccountCoverageCepContext: () => getAccountCoverageCepContextMock(),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

describe("POST /api/cart/stock", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    getAccountCoverageCepContextMock.mockReset();
    wpRestMock.mockReset();
    getServerSessionMock.mockResolvedValue({
      user: { id: "42" },
      accessToken: "token",
      role: "customer",
    });
    getAccountCoverageCepContextMock.mockResolvedValue({ cep: "01310930" });
  });

  it("returns fresh stock from the vendor assigned to each cart item", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: {
        "1": {
          has_coverage: true,
          best_vendor: { vendor_id: 101, qty: 3 },
          alternatives: [],
        },
        "2": {
          has_coverage: false,
          best_vendor: null,
          alternatives: [],
        },
      },
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/cart/stock", {
        method: "POST",
        body: JSON.stringify({
          items: [
            { productId: 1, vendorId: 101 },
            { productId: 2, vendorId: 101 },
          ],
        }),
      }),
    );

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/coverage/products?cep=01310930&product_ids=1%2C2&qty=1&vendor_id=101",
      { revalidate: 0 },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      products: {
        "1": { available: true, stockQty: 3 },
        "2": { available: false, stockQty: 0 },
      },
    });
  });

  it("validates items from different vendors independently", async () => {
    wpRestMock.mockImplementation((path: string) => {
      const vendorId = path.includes("vendor_id=101") ? 101 : 202;
      const productId = vendorId === 101 ? "1" : "2";
      return Promise.resolve({
        ok: true,
        data: {
          [productId]: {
            has_coverage: true,
            best_vendor: { vendor_id: vendorId, qty: vendorId === 101 ? 3 : 7 },
          },
        },
      });
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/cart/stock", {
        method: "POST",
        body: JSON.stringify({
          items: [
            { productId: 1, vendorId: 101 },
            { productId: 2, vendorId: 202 },
          ],
        }),
      }),
    );

    expect(wpRestMock).toHaveBeenCalledTimes(2);
    expect(await response.json()).toEqual({
      status: "ok",
      products: {
        "1": { available: true, stockQty: 3 },
        "2": { available: true, stockQty: 7 },
      },
    });
  });

  it("requires an authenticated customer session", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/cart/stock", {
        method: "POST",
        body: JSON.stringify({ items: [{ productId: 1, vendorId: 101 }] }),
      }),
    );

    expect(response.status).toBe(401);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("rejects non-customer roles", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "42" },
      accessToken: "token",
      role: "seller",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/cart/stock", {
        method: "POST",
        body: JSON.stringify({ items: [{ productId: 1, vendorId: 101 }] }),
      }),
    );

    expect(response.status).toBe(403);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("rejects invalid or oversized item payloads", async () => {
    const { POST } = await import("./route");
    const invalid = await POST(
      new Request("http://localhost/api/cart/stock", {
        method: "POST",
        body: JSON.stringify({ items: [{ productId: 0, vendorId: 101 }] }),
      }),
    );
    const oversized = await POST(
      new Request("http://localhost/api/cart/stock", {
        method: "POST",
        body: JSON.stringify({
          items: Array.from({ length: 121 }, (_, index) => ({
            productId: index + 1,
            vendorId: 101,
          })),
        }),
      }),
    );

    expect(invalid.status).toBe(422);
    expect(oversized.status).toBe(422);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("requires the account CEP", async () => {
    getAccountCoverageCepContextMock.mockResolvedValue({ cep: null });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/cart/stock", {
        method: "POST",
        body: JSON.stringify({ items: [{ productId: 1, vendorId: 101 }] }),
      }),
    );

    expect(response.status).toBe(422);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("fails closed when WordPress stock validation is unavailable", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 503,
      error: { code: "unavailable", message: "WP unavailable" },
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/cart/stock", {
        method: "POST",
        body: JSON.stringify({ items: [{ productId: 1, vendorId: 101 }] }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "unavailable",
      message: "Nao foi possivel validar o estoque agora. Tente novamente.",
    });
  });
});
