import { describe, expect, it } from "vitest";

import { centsToRefundInput, refundInputToCents } from "./money";

describe("refundInputToCents", () => {
  it.each([
    ["50,00", 5000],
    ["50.00", 5000],
    ["1.234,56", 123456],
  ])("converts %s without inflating cents", (input, expected) => {
    expect(refundInputToCents(input)).toBe(expected);
  });

  it("shows the initial refund in the Brazilian format", () => {
    expect(centsToRefundInput(5000)).toBe("50,00");
  });
});
