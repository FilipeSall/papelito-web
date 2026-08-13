import { describe, expect, it } from "vitest";

import { CATEGORIES_NAV_ITEMS, resolveCategoryNavSubtitle } from "./constants";

function itemFor(collection: string) {
  const item = CATEGORIES_NAV_ITEMS.find(
    (candidate) => candidate.collection === collection,
  );

  if (!item) {
    throw new Error(`Item de navegação ausente: ${collection}`);
  }

  return item;
}

const kits = itemFor("kits");
const promocoes = itemFor("promocoes");
const premium = itemFor("premium");

describe("resolveCategoryNavSubtitle", () => {
  it("usa o texto fixo quando o resumo não veio", () => {
    expect(resolveCategoryNavSubtitle(kits)).toBe("Kits exclusivos");
    expect(resolveCategoryNavSubtitle(promocoes, null)).toBe("Até 15% off");
  });

  it("conta os kits reais, no singular e no plural", () => {
    expect(
      resolveCategoryNavSubtitle(kits, {
        kitsCount: 1,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe("1 kit disponível");

    expect(
      resolveCategoryNavSubtitle(kits, {
        kitsCount: 6,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe("6 kits disponíveis");

    expect(
      resolveCategoryNavSubtitle(kits, {
        kitsCount: 12,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe("12 kits disponíveis");
  });

  it("sem kit disponível mantém o texto fixo em vez de '0 kits disponíveis'", () => {
    expect(
      resolveCategoryNavSubtitle(kits, {
        kitsCount: 0,
        promotionsMaxDiscountPercent: 25,
      }),
    ).toBe("Kits exclusivos");
  });

  it("anuncia o maior desconto real das promoções", () => {
    expect(
      resolveCategoryNavSubtitle(promocoes, {
        kitsCount: 0,
        promotionsMaxDiscountPercent: 25,
      }),
    ).toBe("Até 25% off");
  });

  it("sem promoção ativa mantém o texto fixo em vez de 'Até 0% off'", () => {
    expect(
      resolveCategoryNavSubtitle(promocoes, {
        kitsCount: 3,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe("Até 15% off");
  });

  it("não mexe nos cards sem número próprio", () => {
    expect(
      resolveCategoryNavSubtitle(premium, {
        kitsCount: 4,
        promotionsMaxDiscountPercent: 25,
      }),
    ).toBe("Top sellers");
  });
});
