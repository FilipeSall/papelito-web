import { describe, expect, it } from "vitest";

import type { QuoteShipping } from "@/features/expocannabis/types/quote";
import { formatCents } from "@/features/expocannabis/utils/cart";

import { shippingLabel } from "./order-summary";

const PAC: QuoteShipping = {
  optionKey: "correios:pac",
  name: "PAC",
  priceCents: 8958,
  discountCents: 0,
  deliveryTime: 6,
  waived: false,
  volumes: 2,
};

const PAC_PRICE = formatCents(PAC.priceCents);

describe("shippingLabel", () => {
  it("mostra o valor cobrado e quantas caixas", () => {
    expect(shippingLabel(PAC)).toBe(`${PAC_PRICE} · PAC · 2 caixas`);
  });

  it("mostra grátis quando o desconto cobre o frete inteiro", () => {
    expect(shippingLabel({ ...PAC, discountCents: 8958 })).toBe("Grátis · PAC · 2 caixas");
  });

  it("avisa a contingência dos Correios fora do ar", () => {
    expect(shippingLabel({ ...PAC, priceCents: 0, waived: true, volumes: 3 })).toBe("Grátis · postar por PAC · 3 caixas");
  });

  it("usa o singular com uma caixa e omite quando não sabe", () => {
    expect(shippingLabel({ ...PAC, volumes: 1 })).toBe(`${PAC_PRICE} · PAC · 1 caixa`);
    expect(shippingLabel({ ...PAC, volumes: 0 })).toBe(`${PAC_PRICE} · PAC`);
  });

  it("nunca mostra campo ausente de cotação antiga como grátis nem como undefined", () => {
    const legacy = { optionKey: "correios:pac", name: "PAC", priceCents: 2990, deliveryTime: 5 } as unknown as QuoteShipping;

    expect(shippingLabel(legacy)).toBe(`${formatCents(2990)} · PAC`);
  });

  it("antes da cotação pede para continuar", () => {
    expect(shippingLabel(null)).toBe("calculado ao continuar");
  });
});
