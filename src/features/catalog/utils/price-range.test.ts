import { describe, expect, it } from "vitest";

import { resolvePriceRange } from "./price-range";

describe("resolvePriceRange", () => {
  it("keeps valid bounds", () => {
    expect(resolvePriceRange("100", "130")).toMatchObject({ kind: "valid", minPrice: 100, maxPrice: 130 });
  });

  it("accepts a single bound and the comma used in Brazilian input", () => {
    expect(resolvePriceRange("100", undefined)).toMatchObject({ kind: "valid", minPrice: 100, maxPrice: null });
    expect(resolvePriceRange(undefined, "130")).toMatchObject({ kind: "valid", minPrice: null, maxPrice: 130 });
    expect(resolvePriceRange("12,50", "99,90")).toMatchObject({ kind: "valid", minPrice: 12.5, maxPrice: 99.9 });
    expect(resolvePriceRange("0", "0")).toMatchObject({ kind: "valid", minPrice: 0, maxPrice: 0 });
  });

  it("treats absent and blank bounds as no filter at all", () => {
    expect(resolvePriceRange(undefined, undefined).kind).toBe("empty");
    expect(resolvePriceRange("", "  ").kind).toBe("empty");
  });

  it("rejects nonnumeric, negative, and inverted bounds", () => {
    expect(resolvePriceRange("abc", "130").kind).toBe("invalid");
    expect(resolvePriceRange("-1", "130").kind).toBe("invalid");
    expect(resolvePriceRange("1000", "1").kind).toBe("invalid");
  });

  /** O usuário precisa ver o que digitou para poder corrigir — o erro sozinho não basta. */
  it("preserves the raw input so the form can be corrected", () => {
    expect(resolvePriceRange("1000", "1")).toMatchObject({
      kind: "invalid",
      rawMinimum: "1000",
      rawMaximum: "1",
      minPrice: null,
      maxPrice: null,
    });
    expect(resolvePriceRange("abc", undefined)).toMatchObject({ rawMinimum: "abc", rawMaximum: null });
  });
});
