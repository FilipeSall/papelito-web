import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, wpRestMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  wpRestMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: wpRestMock,
}));

import { getProfileOrderDetail, getProfileOrders, resolveStatus } from "./get-profile-order-detail";

describe("resolveStatus", () => {
  it("marks unpaid orders with expired payment state as expired", () => {
    expect(
      resolveStatus({
        payment: { state: "expired" },
        vendor_status: "aguardando_pagamento",
      }),
    ).toBe("expired");
  });

  it("marks unpaid orders with a past deadline as expired", () => {
    expect(
      resolveStatus(
        {
          payment: { pix: { expires_at: "2026-06-11T22:00:00Z" } },
          vendor_status: "aguardando_pagamento",
        },
        Date.UTC(2026, 5, 11, 23, 0, 0),
      ),
    ).toBe("expired");
  });

  it("does not override fulfilled orders even if an old deadline exists", () => {
    expect(
      resolveStatus(
        {
          payment: { pix: { expires_at: "2026-06-11T22:00:00Z" } },
          vendor_status: "enviado",
        },
        Date.UTC(2026, 5, 11, 23, 0, 0),
      ),
    ).toBe("shipped");
  });
});

describe("getProfileOrders", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    wpRestMock.mockReset();
  });

  it("requests the selected page with 10 items and derives expired summaries from detail", async () => {
    getServerSessionMock.mockResolvedValue({ accessToken: "token" });
    wpRestMock
      .mockResolvedValueOnce({
        ok: true,
        data: {
          items: [
            {
              created_at: "2026-06-11 12:00:00",
              id: 11879,
              items_count: 1,
              order_number: "11879",
              total: 71.36,
              vendor_status: "aguardando_pagamento",
            },
            {
              created_at: "2026-06-12 12:00:00",
              id: 11880,
              items_count: 1,
              order_number: "11880",
              total: 89.32,
              vendor_status: "aguardando_envio",
            },
          ],
          page: 2,
          per_page: 10,
          total: 12,
          total_pages: 2,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          created_at: "2026-06-11 12:00:00",
          id: 11879,
          items_count: 1,
          order_number: "11879",
          payment: {
            state: "expired",
          },
          total: 71.36,
          vendor_status: "aguardando_pagamento",
        },
      });

    const snapshot = await getProfileOrders({ page: 2, perPage: 10 });

    expect(wpRestMock).toHaveBeenNthCalledWith(
      1,
      "/papelito/v1/profile/me/orders?page=2&per_page=10",
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
      }),
    );
    expect(wpRestMock).toHaveBeenNthCalledWith(
      2,
      "/papelito/v1/profile/me/orders/11879",
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
      }),
    );
    expect(snapshot.page).toBe(2);
    expect(snapshot.perPage).toBe(10);
    expect(snapshot.total).toBe(12);
    expect(snapshot.totalPages).toBe(2);
    expect(snapshot.items).toHaveLength(2);
    expect(snapshot.items[0]?.status).toBe("expired");
    expect(snapshot.items[1]?.status).toBe("awaiting_shipment");
  });
});

describe("getProfileOrderDetail", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    wpRestMock.mockReset();
  });

  it("maps the receipt summary returned by the customer order detail", async () => {
    getServerSessionMock.mockResolvedValue({ accessToken: "token" });
    wpRestMock.mockResolvedValue({
      ok: true,
      data: {
        id: 42,
        receipt: {
          available: true,
          issued_at: "03/07/2026 09:31",
          number: "PPL-2026-000482",
        },
      },
    });

    await expect(getProfileOrderDetail("42")).resolves.toMatchObject({
      receipt: {
        available: true,
        issuedAtLabel: "03/07/2026 09:31",
        number: "PPL-2026-000482",
      },
    });
  });
});
