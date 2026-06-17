import { describe, expect, it } from "vitest";

import {
  buildSalesSeriesPoints,
  formatSalesSeriesLabel,
  formatSalesSeriesTooltipLabel,
  resolveSalesInterval,
} from "./sales-series";

describe("resolveSalesInterval", () => {
  it("keeps 30-day windows daily", () => {
    expect(
      resolveSalesInterval({
        from: "2026-05-18",
        to: "2026-06-16",
        preset: "30d",
      }),
    ).toBe("day");
  });

  it("keeps current-month preset daily", () => {
    expect(
      resolveSalesInterval({
        from: "2026-05-01",
        to: "2026-05-31",
        preset: "month",
      }),
    ).toBe("day");
  });

  it("switches longer custom windows to monthly", () => {
    expect(
      resolveSalesInterval({
        from: "2026-01-01",
        to: "2026-02-01",
        preset: "custom",
      }),
    ).toBe("month");
  });
});

describe("buildSalesSeriesPoints", () => {
  it("fills daily gaps with zeroes", () => {
    expect(
      buildSalesSeriesPoints({
        from: "2026-06-01",
        to: "2026-06-03",
        interval: "day",
        valuesByKey: {
          "2026-06-02": 75,
        },
      }),
    ).toEqual([
      { key: "2026-06-01", label: "01/06", tooltipLabel: "01/06/2026", value: 0 },
      { key: "2026-06-02", label: "02/06", tooltipLabel: "02/06/2026", value: 75 },
      { key: "2026-06-03", label: "03/06", tooltipLabel: "03/06/2026", value: 0 },
    ]);
  });

  it("formats monthly points with month labels", () => {
    expect(
      buildSalesSeriesPoints({
        from: "2026-01-10",
        to: "2026-03-18",
        interval: "month",
        valuesByKey: {
          "2026-01": 10,
          "2026-03-05": 30,
        },
      }),
    ).toEqual([
      { key: "2026-01", label: "Jan", tooltipLabel: "Jan/2026", value: 10 },
      { key: "2026-02", label: "Fev", tooltipLabel: "Fev/2026", value: 0 },
      { key: "2026-03", label: "Mar", tooltipLabel: "Mar/2026", value: 30 },
    ]);
  });

  it("adds year to monthly labels when the range crosses years", () => {
    expect(
      buildSalesSeriesPoints({
        from: "2025-11-10",
        to: "2026-02-18",
        interval: "month",
        valuesByKey: {
          "2025-11": 10,
          "2026-02": 20,
        },
      }),
    ).toEqual([
      { key: "2025-11", label: "Nov/25", tooltipLabel: "Nov/2025", value: 10 },
      { key: "2025-12", label: "Dez/25", tooltipLabel: "Dez/2025", value: 0 },
      { key: "2026-01", label: "Jan/26", tooltipLabel: "Jan/2026", value: 0 },
      { key: "2026-02", label: "Fev/26", tooltipLabel: "Fev/2026", value: 20 },
    ]);
  });
});

describe("sales series labels", () => {
  it("formats axis and tooltip labels coherently", () => {
    expect(formatSalesSeriesLabel("2026-06-16", "day")).toBe("16/06");
    expect(formatSalesSeriesTooltipLabel("2026-06-16", "day")).toBe("16/06/2026");
    expect(formatSalesSeriesLabel("2026-02", "month")).toBe("Fev");
    expect(formatSalesSeriesTooltipLabel("2026-02", "month")).toBe("Fev/2026");
  });
});
