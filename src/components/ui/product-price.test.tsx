import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductPrice } from "./product-price";

describe("ProductPrice", () => {
  it("shows original price only when it is greater than the current price", () => {
    const { rerender } = render(<ProductPrice original={59.9} current={39.9} />);

    expect(screen.getByText("R$ 59,90")).toBeInTheDocument();
    expect(screen.getByText("R$ 39,90")).toBeInTheDocument();

    rerender(<ProductPrice original={39.9} current={39.9} />);
    expect(screen.queryByText("R$ 59,90")).not.toBeInTheDocument();
  });
});
