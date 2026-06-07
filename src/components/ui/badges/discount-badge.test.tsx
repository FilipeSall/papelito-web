import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DiscountBadge } from "./discount-badge";

describe("DiscountBadge", () => {
  it("renders the badge for positive discounts", () => {
    render(<DiscountBadge discount={15} />);

    expect(screen.getByText("-15%")).toBeInTheDocument();
  });

  it("does not render for non-positive or invalid discounts", () => {
    const { rerender, container } = render(<DiscountBadge discount={0} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<DiscountBadge discount={Number.NaN} />);
    expect(container).toBeEmptyDOMElement();
  });
});
