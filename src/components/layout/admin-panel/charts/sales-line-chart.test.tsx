import { render, screen } from "@testing-library/react";
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
});
