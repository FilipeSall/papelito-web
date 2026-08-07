import { beforeEach, describe, expect, it, vi } from "vitest";

const wpRestMock = vi.fn();

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

import { getAdminSalesAnalyticsSnapshot } from "./admin-sales-analytics";

const filters = {
  afterIso: "2026-08-01T00:00:00",
  beforeIso: "2026-08-31T23:59:59",
  from: "2026-08-01",
  interval: "day" as const,
  page: 1,
  perPage: 20,
  periodLabel: "01/08/2026 - 31/08/2026",
  preset: "month" as const,
  to: "2026-08-31",
};

describe("getAdminSalesAnalyticsSnapshot", () => {
  beforeEach(() => {
    wpRestMock.mockReset();
  });

  it("uses the payment-confirmed backend snapshot even when Woo Analytics would be active", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: {
        avgOrderValue: 67.5,
        discountsTotal: 10,
        grossRevenue: 135,
        itemsSold: 3,
        leaderboard: [{ label: "produto pago", share: 100, value: 130 }],
        netRevenue: 100,
        orderStatusSeries: [
          { label: "failed", value: 1 },
          { label: "processing", value: 1 },
          { label: "refunded", value: 1 },
        ],
        orderVolumeByInterval: { "2026-08-04": 2, "2026-08-05": 1 },
        orders: 2,
        paymentMixSeries: [{ label: "cartão", value: 135 }],
        refundsTotal: 30,
        revenueByInterval: { "2026-08-04": 105, "2026-08-05": 30 },
        shippingTotal: 5,
        taxesTotal: 0,
      },
    });

    const snapshot = await getAdminSalesAnalyticsSnapshot("token", filters);

    expect(snapshot.orders).toBe(2);
    expect(snapshot.grossRevenue).toBe(135);
    expect(snapshot.itemsSold).toBe(3);
    expect(snapshot.orderStatusSeries).toEqual([
      { label: "failed", value: 1 },
      { label: "processing", value: 1 },
      { label: "refunded", value: 1 },
    ]);
    expect(snapshot.revenueSeries.find((point) => point.key === "2026-08-04")?.value).toBe(105);
    expect(wpRestMock).toHaveBeenCalledTimes(1);
    expect(wpRestMock.mock.calls[0]?.[0]).toContain("/papelito/v1/admin/sales/snapshot?");
  });
});
