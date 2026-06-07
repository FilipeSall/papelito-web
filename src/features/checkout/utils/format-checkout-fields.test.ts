import { describe, expect, it } from "vitest";

import {
  formatCardNumber,
  formatExpiryDate,
  formatZipCode,
} from "./format-checkout-fields";

describe("format-checkout-fields", () => {
  it("formats zip code in 00000-000 format", () => {
    expect(formatZipCode("01310930")).toBe("01310-930");
  });

  it("formats card number in groups of four digits", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
  });

  it("formats expiry date as MM/YY", () => {
    expect(formatExpiryDate("1228")).toBe("12/28");
    expect(formatExpiryDate("12")).toBe("12");
  });
});
