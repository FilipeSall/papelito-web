import { describe, expect, it } from "vitest";

import type { PromoMarqueeItem } from "@/types/home-assets";

import { getPromoMarqueeValidation } from "./promo-marquee-validation";

function messages(activeCount: number, total = 5): PromoMarqueeItem[] {
  return Array.from({ length: total }, (_, index) => ({
    id: `message-${index + 1}`,
    text: `Mensagem ${index + 1}`,
    order: index + 1,
    isActive: index < activeCount,
  }));
}

describe("getPromoMarqueeValidation", () => {
  it.each([
    [0, 3],
    [1, 2],
    [2, 1],
  ])("requires %i more active messages when %i are active", (activeCount, missing) => {
    const validation = getPromoMarqueeValidation(messages(activeCount));

    expect(validation.isValid).toBe(false);
    expect(validation.missingActiveMessages).toBe(missing);
    expect(validation.message).toContain(`Ative mais ${missing}`);
  });

  it.each([3, 4, 5])("accepts %i active messages", (activeCount) => {
    const validation = getPromoMarqueeValidation(messages(activeCount));

    expect(validation.isValid).toBe(true);
    expect(validation.missingActiveMessages).toBe(0);
  });
});
