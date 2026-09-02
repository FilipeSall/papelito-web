import { beforeEach, describe, expect, it, vi } from "vitest";

const wpRestMock = vi.fn();

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

import {
  getAdminSalesOrdersAggregate,
  getAdminSalesOrdersSnapshot,
} from "./admin-sales-orders";

const filters = {
  afterIso: "2026-08-01T00:00:00",
  beforeIso: "2026-08-31T23:59:59",
  from: "2026-08-01",
  interval: "day" as const,
  page: 1,
  perPage: 10,
  periodLabel: "01/08/2026 - 31/08/2026",
  preset: "month" as const,
  segment: "all" as const,
  to: "2026-08-31",
};

describe("getAdminSalesOrdersAggregate", () => {
  beforeEach(() => {
    wpRestMock.mockReset();
  });

  it("counts only payment-confirmed orders as sales while preserving all order statuses in the volume series", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: [
        {
          date_created: "2026-08-04T10:00:00",
          discount_total: "0",
          id: 1,
          line_items: [{ name: "Produto falho", quantity: 1, total: "99" }],
          shipping_total: "0",
          status: "failed",
          total: "99",
          total_refunded: "0",
          total_tax: "0",
        },
        {
          date_created: "2026-08-04T11:00:00",
          discount_total: "10",
          id: 2,
          line_items: [{ name: "Produto pago", quantity: 2, total: "100" }],
          shipping_total: "5",
          status: "processing",
          total: "105",
          total_refunded: "0",
          total_tax: "0",
        },
        {
          date_created: "2026-08-05T10:00:00",
          discount_total: "0",
          id: 3,
          line_items: [{ name: "Produto reembolsado", quantity: 1, total: "30" }],
          shipping_total: "0",
          status: "refunded",
          total: "30",
          total_refunded: "30",
          total_tax: "0",
        },
      ],
      headers: new Headers({
        "X-WP-Total": "3",
        "X-WP-TotalPages": "1",
      }),
    });

    const aggregate = await getAdminSalesOrdersAggregate("token", filters);

    expect(aggregate.totalOrdersAvailable).toBe(3);
    expect(aggregate.orders).toBe(2);
    expect(aggregate.grossRevenue).toBe(135);
    expect(aggregate.netRevenue).toBe(100);
    expect(aggregate.itemsSold).toBe(3);
    expect(aggregate.orderVolumeSeries.find((point) => point.label === "04/08")?.value).toBe(2);
    expect(aggregate.orderStatusSeries).toEqual([
      { label: "failed", value: 1 },
      { label: "processing", value: 1 },
      { label: "refunded", value: 1 },
    ]);
  });
});

describe("getAdminSalesOrdersSnapshot", () => {
  beforeEach(() => {
    wpRestMock.mockReset();
  });

  it("identifica o cliente pelo shipping quando o billing B2B nasce sem nome", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: [
        {
          billing: { company: "CERRADO PAPEIS E SUPRIMENTOS LTDA", first_name: "", last_name: "" },
          date_created: "2026-09-01T02:05:18",
          id: 14094,
          line_items: [],
          shipping: { first_name: "Marcos", last_name: "Stub de Oliveira" },
          status: "processing",
          total: "490",
        },
        {
          billing: { company: "CERRADO PAPEIS E SUPRIMENTOS LTDA", first_name: "", last_name: "" },
          date_created: "2026-08-31T23:45:12",
          id: 14088,
          line_items: [],
          shipping: { first_name: "", last_name: "" },
          status: "processing",
          total: "110.27",
        },
        {
          billing: { company: "", first_name: "", last_name: "" },
          date_created: "2026-08-31T21:23:26",
          id: 14087,
          line_items: [],
          shipping: { first_name: "", last_name: "" },
          status: "processing",
          total: "346.35",
        },
      ],
      headers: new Headers({ "X-WP-Total": "3", "X-WP-TotalPages": "1" }),
    });

    const snapshot = await getAdminSalesOrdersSnapshot("token", filters);

    expect(snapshot.orders.map((order) => order.customerLabel)).toEqual([
      "Marcos Stub de Oliveira",
      "CERRADO PAPEIS E SUPRIMENTOS LTDA",
      "Cliente não identificado",
    ]);
  });

  it("pede ao WooCommerce no maximo 10 pedidos por pagina", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: [],
      headers: new Headers({ "X-WP-Total": "0", "X-WP-TotalPages": "0" }),
    });

    await getAdminSalesOrdersSnapshot("token", { ...filters, page: 3 });

    expect(wpRestMock.mock.calls[0]?.[0]).toContain("per_page=10");
    expect(wpRestMock.mock.calls[0]?.[0]).toContain("page=3");
  });
});
