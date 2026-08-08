import { describe, expect, it } from "vitest";

import {
  FREE_SHIPPING_MINIMUM_TOKEN,
  formatFreeShippingCouponCopy,
  resolveFreeShippingPlaceholder,
} from "./free-shipping-copy";

describe("free-shipping copy", () => {
  it("uses the configured cents in the fixed copy", () => {
    expect(formatFreeShippingCouponCopy(9900)).toBe("A partir de R$ 99,00 com cupom");
  });

  it("does not invent a monetary fallback when the configuration is unavailable", () => {
    expect(formatFreeShippingCouponCopy(null)).toBe("Com cupom");
  });
});

describe("resolveFreeShippingPlaceholder", () => {
  it("returns admin text untouched when it has no token", () => {
    expect(resolveFreeShippingPlaceholder("⚡ COMPRE 3 LEVE 4 em Sedas", 9900)).toBe(
      "⚡ COMPRE 3 LEVE 4 em Sedas",
    );
  });

  it("keeps text without a token even when the minimum is unavailable", () => {
    expect(resolveFreeShippingPlaceholder("🎁 BRINDE em pedidos acima de R$500", null)).toBe(
      "🎁 BRINDE em pedidos acima de R$500",
    );
  });

  it("replaces the token in the middle of the admin sentence", () => {
    expect(
      resolveFreeShippingPlaceholder(
        `🔥 FRETE GRÁTIS a partir de ${FREE_SHIPPING_MINIMUM_TOKEN} com cupom`,
        12550,
      ),
    ).toBe("🔥 FRETE GRÁTIS a partir de R$ 125,50 com cupom");
  });

  it("replaces every occurrence of the token", () => {
    expect(
      resolveFreeShippingPlaceholder(
        `${FREE_SHIPPING_MINIMUM_TOKEN} e de novo ${FREE_SHIPPING_MINIMUM_TOKEN}`,
        9900,
      ),
    ).toBe("R$ 99,00 e de novo R$ 99,00");
  });

  it("refuses to render a promise it cannot honour", () => {
    const text = `🔥 FRETE GRÁTIS a partir de ${FREE_SHIPPING_MINIMUM_TOKEN} com cupom`;

    expect(resolveFreeShippingPlaceholder(text, null)).toBeNull();
    expect(resolveFreeShippingPlaceholder(text, 0)).toBeNull();
    expect(resolveFreeShippingPlaceholder(text, -1)).toBeNull();
    expect(resolveFreeShippingPlaceholder(text, 99.5)).toBeNull();
  });
});
