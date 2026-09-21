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

describe("rastreio multicarrier no detalhe do comprador", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    wpRestMock.mockReset();
    getServerSessionMock.mockResolvedValue({ accessToken: "token" });
  });

  function buildOrder(overrides: Record<string, unknown> = {}) {
    return {
      created_at: "2026-09-18 12:00:00",
      delivery_time_days: 3,
      id: 11886,
      items_count: 1,
      order_number: "11886",
      total: 12.76,
      vendor_name: "Cifal Distribuidora",
      vendor_status: "enviado",
      ...overrides,
    };
  }

  it("mostra o rastreio de um pedido Braspress, que não tem código S10", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: buildOrder({
        shipping_provider: "braspress",
        shipping_service: "Rodoviário",
        logistics: {
          status: "in_transit",
          shipments: [
            {
              id: 7,
              provider: "braspress",
              external_reference: "PED-2026-0001",
              tracking_code: null,
              status: "in_transit",
              last_event_at: "2026-09-20 11:15:00",
              last_event_description: "Mercadoria coletada",
              last_event_location: "SAO PAULO - SP",
            },
          ],
        },
      }),
    });

    const detail = await getProfileOrderDetail("11886");

    expect(detail?.tracking).not.toBeNull();
    expect(detail?.tracking?.carrierLabel).toBe("Braspress");
    expect(detail?.tracking?.code).toBe("PED-2026-0001");
    expect(detail?.tracking?.provider).toBe("braspress");
    expect(detail?.shipments[0]?.carrierLabel).toBe("Braspress");
    expect(detail?.shipments[0]?.provider).toBe("braspress");
  });

  it("prefere a previsão que a transportadora deu agora à promessa do checkout", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: buildOrder({
        shipping_provider: "braspress",
        delivery_time_days: 5,
        logistics: {
          status: "in_transit",
          shipments: [
            {
              id: 9,
              provider: "braspress",
              external_reference: "PED-2026/001",
              status: "in_transit",
              estimated_delivery_at: "2026-09-28 21:00:00",
            },
          ],
        },
      }),
    });

    const detail = await getProfileOrderDetail("11886");

    expect(detail?.tracking?.estimatedDeliveryLabel).toBe("Previsão da transportadora: 28/09/2026");
  });

  it("mantém o prazo do checkout enquanto a transportadora não disser nada", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: buildOrder({
        shipping_provider: "braspress",
        delivery_time_days: 5,
        logistics: {
          status: "in_transit",
          shipments: [
            { id: 9, provider: "braspress", external_reference: "PED-2026/001", status: "in_transit" },
          ],
        },
      }),
    });

    const detail = await getProfileOrderDetail("11886");

    expect(detail?.tracking?.estimatedDeliveryLabel).toBe("5 dias úteis");
  });

  it("não inventa rastreio quando a remessa ainda não tem referência alguma", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: buildOrder({
        vendor_status: "em_separacao",
        shipping_provider: "braspress",
        logistics: {
          status: "tracking_pending",
          shipments: [
            {
              id: 8,
              provider: "braspress",
              external_reference: "",
              tracking_code: null,
              status: "tracking_pending",
            },
          ],
        },
      }),
    });

    const detail = await getProfileOrderDetail("11886");

    expect(detail?.tracking).toBeNull();
  });

  it("mantém o pedido Correios legado legível, com o código S10", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: buildOrder({
        tracking_code: "AA123456789BR",
        shipping_service: "PAC",
        logistics: {
          status: "posted",
          shipments: [
            {
              id: 9,
              provider: "correios",
              tracking_code: "AA123456789BR",
              status: "posted",
            },
          ],
        },
      }),
    });

    const detail = await getProfileOrderDetail("11886");

    expect(detail?.tracking?.code).toBe("AA123456789BR");
    expect(detail?.tracking?.carrierLabel).toBe("Correios");
    expect(detail?.tracking?.provider).toBe("correios");
    expect(detail?.shipments[0]?.carrierLabel).toBe("Correios");
  });

  it("preserva o código próprio de cada pacote em pedidos com múltiplas remessas", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: buildOrder({
        tracking_code: "AA111111111BR",
        shipping_provider: "correios",
        shipping_service: "PAC",
        logistics: {
          status: "posted",
          shipments: [
            {
              id: 10,
              provider: "correios",
              tracking_code: "AA111111111BR",
              status: "posted",
            },
            {
              id: 11,
              provider: "correios",
              tracking_code: "BB222222222BR",
              status: "posted",
            },
          ],
        },
      }),
    });

    const detail = await getProfileOrderDetail("11886");

    expect(detail?.shipments.map(({ code }) => code)).toEqual([
      "AA111111111BR",
      "BB222222222BR",
    ]);
  });

  it("usa o código agregado como fallback quando a remessa legada não traz referência", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: buildOrder({
        tracking_code: "CC333333333BR",
        shipping_service: "PAC",
        logistics: {
          status: "posted",
          shipments: [{ id: 12, status: "posted" }],
        },
      }),
    });

    const detail = await getProfileOrderDetail("11886");

    expect(detail?.tracking?.code).toBe("CC333333333BR");
    expect(detail?.shipments[0]?.code).toBe("CC333333333BR");
  });

  it("não promete Correios na linha do tempo de um pedido de outra transportadora", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: buildOrder({
        shipping_provider: "braspress",
        logistics: {
          status: "in_transit",
          shipments: [
            { id: 7, provider: "braspress", external_reference: "PED-2026-0001", status: "in_transit" },
          ],
        },
      }),
    });

    const detail = await getProfileOrderDetail("11886");
    const texts = detail!.timeline.map((event) => `${event.title} ${event.description}`).join(" | ");

    expect(texts).not.toMatch(/Correios/i);
  });
});
