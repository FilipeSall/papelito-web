import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SalesBarsChart } from "./sales-bars-chart";

describe("SalesBarsChart", () => {
  it("shows the selected bar value in the shared tooltip", () => {
    render(
      <SalesBarsChart
        label="pedidos por status"
        points={[
          { label: "concluído", value: 12 },
          { label: "pendente", value: 3 },
        ]}
      />,
    );

    const bar = screen.getByRole("button", { name: "pendente: 3" });
    fireEvent.pointerEnter(bar);

    expect(screen.getByRole("tooltip")).toHaveTextContent("pendente3");
  });
});
