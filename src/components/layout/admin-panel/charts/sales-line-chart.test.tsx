import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SalesLineChart } from "./sales-line-chart";

describe("SalesLineChart", () => {
  it("renders a clear empty state instead of a rounded zero-value scale", () => {
    render(
      <SalesLineChart
        emptyMessage="Nenhuma venda confirmada no período."
        label="receita por período"
        points={[
          { key: "2026-08-01", label: "01/08", value: 0 },
          { key: "2026-08-02", label: "02/08", value: 0 },
        ]}
      />,
    );

    expect(screen.getByText("Nenhuma venda confirmada no período.")).toBeInTheDocument();
  });

  it("renders one portal tooltip for a zero-value point without duplicating the SVG label", () => {
    render(
      <SalesLineChart
        label="receita por período"
        points={[
          { key: "2026-09-01", label: "01/09", tooltipLabel: "01/09/2026", value: 500 },
          { key: "2026-09-02", label: "02/09", tooltipLabel: "02/09/2026", value: 0 },
        ]}
      />,
    );

    const point = screen.getByRole("button", { name: /02\/09\/2026/ });
    expect(point.tagName).toBe("circle");
    fireEvent.pointerEnter(point);

    expect(screen.getByRole("tooltip")).toHaveTextContent("02/09/2026R$ 0,00");
    expect(screen.getByText("02/09")).toBeInTheDocument();
    expect(screen.queryByTitle(/02\/09\/2026/)).not.toBeInTheDocument();

    fireEvent.pointerLeave(point);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
