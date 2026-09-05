import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SalesDonutChart } from "./sales-donut-chart";

describe("SalesDonutChart", () => {
  it("shows the selected payment slice value and share", () => {
    render(
      <SalesDonutChart
        label="mix por método de pagamento"
        points={[
          { label: "cartão", value: 75 },
          { label: "pix", value: 25 },
        ]}
      />,
    );

    const slice = screen.getByRole("button", { name: "pix: 25, 25%" });
    fireEvent.pointerEnter(slice);

    expect(screen.getByRole("tooltip")).toHaveTextContent("pix2525%");
  });
});
