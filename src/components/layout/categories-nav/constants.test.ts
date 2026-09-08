import { describe, expect, it } from "vitest";

import { COLLECTION_NAV_DEFAULTS } from "@/lib/home-collections-nav";

import { isCategoryNavItemVisible, resolveCategoryNavSubtitle } from "./constants";

function itemFor(id: string) {
  const item = COLLECTION_NAV_DEFAULTS.find((candidate) => candidate.id === id);

  if (!item) {
    throw new Error(`Item de navegação ausente: ${id}`);
  }

  return item;
}

const kits = itemFor("kits");
const promocoes = itemFor("promocoes");
const premium = itemFor("premium");

describe("COLLECTION_NAV_DEFAULTS", () => {
  it("espelha o seed do WordPress, para a Home degradar no corredor de sempre", () => {
    expect(COLLECTION_NAV_DEFAULTS.map((item) => item.id)).toEqual([
      "kits",
      "premium",
      "promocoes",
      "novidades",
    ]);
    expect(COLLECTION_NAV_DEFAULTS.map((item) => item.href)).toEqual([
      "/kits",
      "/premium",
      "/promocoes",
      "/novidades",
    ]);
    expect(COLLECTION_NAV_DEFAULTS.map((item) => item.order)).toEqual([1, 2, 3, 4]);
    expect(COLLECTION_NAV_DEFAULTS.every((item) => item.isActive)).toBe(true);
  });

  it("só amarra número ao vivo onde o catálogo tem número", () => {
    expect(itemFor("kits").collection).toBe("kits");
    expect(itemFor("promocoes").collection).toBe("promocoes");
    expect(itemFor("premium").collection).toBe("");
    expect(itemFor("novidades").collection).toBe("");
  });
});

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
