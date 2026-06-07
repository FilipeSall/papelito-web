import { describe, expect, it } from "vitest";

import { formatBRL, formatBRLIntl } from "./format-currency";

describe("format-currency", () => {
  it("formats currency in the lightweight BRL formatter", () => {
    expect(formatBRL(29.9)).toBe("R$ 29,90");
  });

  it("formats currency with Intl", () => {
    expect(formatBRLIntl(29.9)).toBe("R$ 29,90");
  });
});
