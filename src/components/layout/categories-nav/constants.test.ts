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
  it("usa o texto fixo quando a coleção não tem destaque", () => {
    expect(resolveCategoryNavSubtitle(kits)).toBe("Kits exclusivos");
    expect(resolveCategoryNavSubtitle(promocoes)).toBe("Ofertas disponíveis");
  });

  it("prefere o destaque retornado pelo backend", () => {
    expect(resolveCategoryNavSubtitle({
      ...promocoes,
      highlight: { label: "Maior desconto", text: "Até 25% off", value: 25 },
    })).toBe("Até 25% off");
  });
});

describe("isCategoryNavItemVisible", () => {
  it("mantém promoções visíveis quando não há promoção vigente", () => {
    expect(isCategoryNavItemVisible({
      ...promocoes,
      indicatorKey: "MAX_DISCOUNT_PERCENT",
      highlight: { label: "Maior desconto", text: "Confira as ofertas", value: 0 },
    })).toBe(true);
  });

  it("mostra promoções quando o backend retorna um desconto válido", () => {
    expect(isCategoryNavItemVisible({
      ...promocoes,
      indicatorKey: "MAX_DISCOUNT_PERCENT",
      highlight: { label: "Maior desconto", text: "Até 25% off", value: 25 },
    })).toBe(true);
  });

  it("coleção sem número próprio nunca some", () => {
    expect(isCategoryNavItemVisible(premium)).toBe(true);
    expect(isCategoryNavItemVisible(kits)).toBe(true);
    expect(isCategoryNavItemVisible(itemFor("novidades"))).toBe(true);
  });
});
