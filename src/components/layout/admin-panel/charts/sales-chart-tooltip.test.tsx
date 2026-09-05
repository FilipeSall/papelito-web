import { describe, expect, it } from "vitest";

import { calculateSalesChartTooltipPosition } from "./sales-chart-tooltip";

const tooltip = { height: 72, width: 140 };
const viewport = { height: 768, width: 1024 };

describe("calculateSalesChartTooltipPosition", () => {
  it("prefers above the anchor near the chart baseline", () => {
    const position = calculateSalesChartTooltipPosition({
      anchor: { x: 512, y: 700 },
      tooltip,
      viewport,
    });

    expect(position.placement).toBe("above");
    expect(position.top).toBe(616);
  });

  it("flips below when the anchor is near the top", () => {
    const position = calculateSalesChartTooltipPosition({
      anchor: { x: 512, y: 24 },
      tooltip,
      viewport,
    });

    expect(position.placement).toBe("below");
    expect(position.top).toBe(36);
  });

  it("clamps the card and caret at both horizontal edges", () => {
    const leftPosition = calculateSalesChartTooltipPosition({
      anchor: { x: 4, y: 300 },
      tooltip,
      viewport,
    });
    const rightPosition = calculateSalesChartTooltipPosition({
      anchor: { x: 1020, y: 300 },
      tooltip,
      viewport,
    });

    expect(leftPosition.left).toBe(12);
    expect(leftPosition.caretLeft).toBe(14);
    expect(rightPosition.left).toBe(872);
    expect(rightPosition.caretLeft).toBe(126);
  });
});
