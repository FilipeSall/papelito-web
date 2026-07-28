import { beforeEach, describe, expect, it, vi } from "vitest";

const requireVendorAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("../_lib/require-vendor-session", () => ({
  requireVendorAccessToken: () => requireVendorAccessTokenMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

describe("GET /api/vendor/orders", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
  });

  it("returns the auth error when the vendor is not authenticated", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ error: "Não autenticado.", status: 401 });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/vendor/orders?status=all"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Não autenticado." });
  });

  it("forwards normalized filters to WordPress and maps the snapshot", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
    wpRestMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: 11883,
            order_number: "11883",
            created_at: "2026-06-12 10:00:00",
            customer_name: "Filipe",
            items_count: 3,
            items_label: "Seda Slim Longa",
            total: 100.36,
            vendor_status: "aguardando_envio",
          },
        ],
        page: 2,
        per_page: 20,
        total: 21,
        total_pages: 2,
      },
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/vendor/orders?status=aguardando_envio&search=%20Filipe%20&page=2"),
    );

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/vendor/me/orders?page=2&per_page=20&status=aguardando_envio&search=Filipe",
      {
        headers: { Authorization: "Bearer vendor-token" },
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [
        {
          createdAt: "2026-06-12 10:00:00",
          customerName: "Filipe",
          id: 11883,
          itemsCount: 3,
          itemsLabel: "Seda Slim Longa",
          orderNumber: "11883",
          status: "aguardando_envio",
          total: 100.36,
        },
      ],
      page: 2,
      perPage: 20,
      total: 21,
      totalPages: 2,
    });
  });

  it("propagates backend failures with a friendly payload", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 502,
      error: {
        code: "papelito_upstream_error",
        message: "WP indisponivel.",
      },
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/vendor/orders?status=pending&page=0"));

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/vendor/me/orders?page=1&per_page=20&status=all",
      {
        headers: { Authorization: "Bearer vendor-token" },
      },
    );
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      code: "papelito_upstream_error",
      message: "WP indisponivel.",
    });
  });
});
