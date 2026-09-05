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

function failure(status: number, message = "WP indisponivel.") {
  return { ok: false, status, error: { code: "papelito_upstream_error", message } };
}

describe("getVendorOrderDetail", () => {
  beforeEach(() => {
    getSellerAccessTokenMock.mockReset();
    wpRestMock.mockReset();
  });

  it("reports an expired session instead of a missing order", async () => {
    getSellerAccessTokenMock.mockResolvedValue(null);

    const { getVendorOrderDetail } = await import("./get-vendor-orders");

    expect(await getVendorOrderDetail("14094")).toEqual({ status: "unauthenticated" });
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("reports a read failure instead of a missing order", async () => {
    getSellerAccessTokenMock.mockResolvedValue("vendor-token");
    wpRestMock.mockResolvedValue(failure(502));

    const { getVendorOrderDetail } = await import("./get-vendor-orders");

    expect(await getVendorOrderDetail("14094")).toEqual({
      message: "WP indisponivel.",
      status: "error",
    });
  });

  it("treats a network failure as a read failure, not a 404", async () => {
    getSellerAccessTokenMock.mockResolvedValue("vendor-token");
    wpRestMock.mockResolvedValue(failure(0, "fetch failed"));

    const { getVendorOrderDetail } = await import("./get-vendor-orders");

    expect(await getVendorOrderDetail("14094")).toEqual({
      message: "fetch failed",
      status: "error",
    });
  });

  it("keeps 404 as not found, so another vendor's order stays indistinguishable", async () => {
    getSellerAccessTokenMock.mockResolvedValue("vendor-token");
    wpRestMock.mockResolvedValue(failure(404, "Pedido nao encontrado."));

    const { getVendorOrderDetail } = await import("./get-vendor-orders");

    expect(await getVendorOrderDetail("14094")).toEqual({ status: "not-found" });
  });

  it("maps 401 and 403 from WordPress to the login path", async () => {
    getSellerAccessTokenMock.mockResolvedValue("vendor-token");

    const { getVendorOrderDetail } = await import("./get-vendor-orders");

    wpRestMock.mockResolvedValue(failure(401));
    expect(await getVendorOrderDetail("14094")).toEqual({ status: "unauthenticated" });

    wpRestMock.mockResolvedValue(failure(403));
    expect(await getVendorOrderDetail("14094")).toEqual({ status: "unauthenticated" });
  });

  it("rejects a non-numeric id before touching the session", async () => {
    const { getVendorOrderDetail } = await import("./get-vendor-orders");

    expect(await getVendorOrderDetail("abc")).toEqual({ status: "not-found" });
    expect(getSellerAccessTokenMock).not.toHaveBeenCalled();
  });

  it("returns the mapped order on success", async () => {
    getSellerAccessTokenMock.mockResolvedValue("vendor-token");
    wpRestMock.mockResolvedValue({
      ok: true,
      data: { id: 14094, order_number: "14094", vendor_status: "em_separacao" },
    });

    const { getVendorOrderDetail } = await import("./get-vendor-orders");
    const result = await getVendorOrderDetail("14094");

    expect(result.status).toBe("ok");
    expect(result.status === "ok" && result.order.orderNumber).toBe("14094");
  });

  it("reads the detail uncached so router.refresh() sees the new state", async () => {
    getSellerAccessTokenMock.mockResolvedValue("vendor-token");
    wpRestMock.mockResolvedValue({ ok: true, data: { id: 14094 } });

    const { getVendorOrderDetail } = await import("./get-vendor-orders");
    await getVendorOrderDetail("14094");

    expect(wpRestMock.mock.calls[0][1]).not.toHaveProperty("revalidate");
  });
});

describe("getVendorOrders", () => {
  const filters = { fiscal: "all", page: 1, search: "", status: "all" } as const;

  beforeEach(() => {
    getSellerAccessTokenMock.mockReset();
    wpRestMock.mockReset();
  });

  it("flags an unreadable list instead of reporting an empty queue", async () => {
    getSellerAccessTokenMock.mockResolvedValue("vendor-token");
    wpRestMock.mockResolvedValue(failure(502));

    const { getVendorOrders } = await import("./get-vendor-orders");
    const snapshot = await getVendorOrders(filters);

    expect(snapshot.unavailable).toBe(true);
    expect(snapshot.items).toEqual([]);
  });

  it("flags a missing session the same way", async () => {
    getSellerAccessTokenMock.mockResolvedValue(null);

    const { getVendorOrders } = await import("./get-vendor-orders");

    expect((await getVendorOrders(filters)).unavailable).toBe(true);
  });

  it("does not flag a genuinely empty queue", async () => {
    getSellerAccessTokenMock.mockResolvedValue("vendor-token");
    wpRestMock.mockResolvedValue({ ok: true, data: { items: [], total: 0, total_pages: 1 } });

    const { getVendorOrders } = await import("./get-vendor-orders");
    const snapshot = await getVendorOrders(filters);

    expect(snapshot.unavailable).toBeUndefined();
    expect(snapshot.total).toBe(0);
  });
});
