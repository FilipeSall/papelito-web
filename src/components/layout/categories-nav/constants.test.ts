import { describe, expect, it } from "vitest";

import {
  CATEGORIES_NAV_ITEMS,
  isCategoryNavItemVisible,
  resolveCategoryNavSubtitle,
} from "./constants";

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
    expect(resolveCategoryNavSubtitle(promocoes, null)).toBe("Ofertas disponíveis");
  });

  it("conta os kits reais, no singular e no plural", () => {
    expect(
      resolveCategoryNavSubtitle(kits, {
        kitsCount: 1,
        promotionsCount: 0,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe("1 kit disponível");

    expect(
      resolveCategoryNavSubtitle(kits, {
        kitsCount: 6,
        promotionsCount: 0,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe("6 kits disponíveis");

    expect(
      resolveCategoryNavSubtitle(kits, {
        kitsCount: 12,
        promotionsCount: 0,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe("12 kits disponíveis");
  });

  it("sem kit disponível mantém o texto fixo em vez de '0 kits disponíveis'", () => {
    expect(
      resolveCategoryNavSubtitle(kits, {
        kitsCount: 0,
        promotionsCount: 2,
        promotionsMaxDiscountPercent: 25,
      }),
    ).toBe("Kits exclusivos");
  });

  it("anuncia o maior desconto real das promoções", () => {
    expect(
      resolveCategoryNavSubtitle(promocoes, {
        kitsCount: 0,
        promotionsCount: 2,
        promotionsMaxDiscountPercent: 25,
      }),
    ).toBe("Até 25% off");
  });

  it("promoção sem desconto arredondável cai no texto genérico, não em 'Até 0% off'", () => {
    expect(
      resolveCategoryNavSubtitle(promocoes, {
        kitsCount: 3,
        promotionsCount: 1,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe("Ofertas disponíveis");
  });

  it("não mexe nos cards sem número próprio", () => {
    expect(
      resolveCategoryNavSubtitle(premium, {
        kitsCount: 4,
        promotionsCount: 2,
        promotionsMaxDiscountPercent: 25,
      }),
    ).toBe("Top sellers");
  });
});

describe("isCategoryNavItemVisible", () => {
  it("esconde promoções quando não há promoção vigente", () => {
    expect(
      isCategoryNavItemVisible(promocoes, {
        kitsCount: 4,
        promotionsCount: 0,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe(false);
  });

  it("mostra promoções assim que existe oferta, mesmo sem desconto arredondável", () => {
    expect(
      isCategoryNavItemVisible(promocoes, {
        kitsCount: 0,
        promotionsCount: 1,
        promotionsMaxDiscountPercent: 0,
      }),
    ).toBe(true);
  });

  it("resumo ausente não esconde nada", () => {
    expect(isCategoryNavItemVisible(promocoes)).toBe(true);
    expect(isCategoryNavItemVisible(promocoes, null)).toBe(true);
  });

  it("coleção sem número próprio nunca some", () => {
    const empty = {
      kitsCount: 0,
      promotionsCount: 0,
      promotionsMaxDiscountPercent: 0,
    };

    expect(isCategoryNavItemVisible(premium, empty)).toBe(true);
    expect(isCategoryNavItemVisible(kits, empty)).toBe(true);
    expect(isCategoryNavItemVisible(itemFor("novidades"), empty)).toBe(true);
  });
});
