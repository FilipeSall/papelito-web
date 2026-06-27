import { describe, expect, it } from "vitest";

import { hasPositiveWeight } from "./weight";

describe("hasPositiveWeight", () => {
  it("accepts positive decimal values with dot or comma", () => {
    expect(hasPositiveWeight("0.4")).toBe(true);
    expect(hasPositiveWeight("0,4")).toBe(true);
  });

  it("rejects empty, zero and invalid values", () => {
    expect(hasPositiveWeight("")).toBe(false);
    expect(hasPositiveWeight("0")).toBe(false);
    expect(hasPositiveWeight("abc")).toBe(false);
    expect(hasPositiveWeight(undefined)).toBe(false);
  });
});
