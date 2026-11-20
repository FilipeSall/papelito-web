import { describe, expect, it } from "vitest";

import { DEFAULT_KIT_PCT_OFF, kitDiscountLabel, readKitPctOff } from "./kit-discount";
import { parseQuote } from "./parse-quote";

describe("readKitPctOff", () => {
  it("usa 15% quando o WordPress ainda não manda o campo", () => {
    expect(readKitPctOff(undefined)).toBe(DEFAULT_KIT_PCT_OFF);
  });

  it.each([0, 20, 50])("aceita %i", (pct) => {
    expect(readKitPctOff(pct)).toBe(pct);
  });

  it.each(["20", 12.5, -1, 101, null])("recusa %s", (value) => {
    expect(readKitPctOff(value)).toBeNull();
  });
});

describe("kitDiscountLabel", () => {
  it("mostra o desconto publicado e nada com 0%", () => {
    expect(kitDiscountLabel(20)).toBe("−20%");
    expect(kitDiscountLabel(50)).toBe("−50%");
    expect(kitDiscountLabel(0)).toBe("");
  });
});

describe("parseQuote com o desconto do kit", () => {
  const quote = {
    units: 14,
    level: { key: "parceiro", name: "Parceiro", minCents: 100000, pctBp: 500 },
    lines: [],
    kit: { qty: 1, unit_cents: 61736, full_unit_cents: 77170, total_cents: 61736 },
    itemsCents: 61736,
    discountCents: 0,
    kitSavingsCents: 15434,
    shipping: { optionKey: "correios:pac", name: "PAC", priceCents: 2990, deliveryTime: 5 },
    totalCents: 64726,
    quoteFingerprint: "fingerprint",
  };

  it("lê o desconto da cotação", () => {
    expect(parseQuote({ ...quote, kitPctOff: 20 })?.kitPctOff).toBe(20);
  });

  it("cai no padrão quando a cotação é de um WordPress antigo", () => {
    expect(parseQuote(quote)?.kitPctOff).toBe(15);
  });
});
