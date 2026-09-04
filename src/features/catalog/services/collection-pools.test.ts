import { describe, expect, it } from "vitest";

import type { ProductsCatalogItem } from "../types/products-catalog";

import { applyCollectionPools, isWithinNewArrivalWindow } from "./wp-catalog";

const NOW = new Date("2026-09-04T12:00:00-03:00").getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

function item(overrides: Partial<ProductsCatalogItem> & { id: string }): ProductsCatalogItem {
  return {
    badge: "",
    category: "Sedas",
    image: undefined,
    isKit: false,
    isNewArrival: false,
    isOnSale: false,
    isPremium: false,
    name: `Produto ${overrides.id}`,
    originalPrice: 10,
    price: 10,
    rating: 4,
    reviews: 10,
    subcategories: [],
    type: "sedas",
    ...overrides,
  };
}

/** Lote em ordem de data decrescente, como o `orderby` da listagem entrega. */
function batch(daysAgo: number[]): ProductsCatalogItem[] {
  return daysAgo.map((days, index) =>
    item({
      id: String(index + 1),
      publishedAt: new Date(NOW - days * DAY_MS).toISOString(),
    }),
  );
}

describe("isWithinNewArrivalWindow", () => {
  it("aceita qualquer data quando não há prazo", () => {
    expect(isWithinNewArrivalWindow(new Date(NOW - 900 * DAY_MS).toISOString(), 0, NOW)).toBe(true);
    expect(isWithinNewArrivalWindow(null, 0, NOW)).toBe(true);
  });

  it("aceita a data dentro do prazo e recusa a que passou dele", () => {
    expect(isWithinNewArrivalWindow(new Date(NOW - 29 * DAY_MS).toISOString(), 30, NOW)).toBe(true);
    expect(isWithinNewArrivalWindow(new Date(NOW - 31 * DAY_MS).toISOString(), 30, NOW)).toBe(false);
  });

  it("recusa produto sem data quando há prazo configurado", () => {
    expect(isWithinNewArrivalWindow(null, 30, NOW)).toBe(false);
    expect(isWithinNewArrivalWindow("", 30, NOW)).toBe(false);
    expect(isWithinNewArrivalWindow("data inválida", 30, NOW)).toBe(false);
  });
});

describe("applyCollectionPools — recém-chegados", () => {
  it("marca os N mais recentes quando não há prazo", () => {
    const result = applyCollectionPools(
      batch([1, 2, 3, 400, 900]),
      { newArrivals: { expirationDays: 0, limit: 3 }, promotions: { limit: 0 } },
      NOW,
    );

    expect(result.filter((entry) => entry.isNewArrival).map((entry) => entry.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("respeita o prazo e devolve menos que o teto quando não há produto recente bastante", () => {
    const result = applyCollectionPools(
      batch([2, 10, 45, 60]),
      { newArrivals: { expirationDays: 30, limit: 10 }, promotions: { limit: 0 } },
      NOW,
    );

    expect(result.filter((entry) => entry.isNewArrival).map((entry) => entry.id)).toEqual([
      "1",
      "2",
    ]);
  });

  it("corta pelo teto mesmo quando todos estão dentro do prazo", () => {
    const result = applyCollectionPools(
      batch([1, 2, 3, 4, 5]),
      { newArrivals: { expirationDays: 30, limit: 2 }, promotions: { limit: 0 } },
      NOW,
    );

    expect(result.filter((entry) => entry.isNewArrival)).toHaveLength(2);
  });

  it("esvazia a coleção quando o teto é zero", () => {
    const result = applyCollectionPools(
      batch([1, 2]),
      { newArrivals: { expirationDays: 0, limit: 0 }, promotions: { limit: 0 } },
      NOW,
    );

    expect(result.some((entry) => entry.isNewArrival)).toBe(false);
  });
});

describe("applyCollectionPools — promoções", () => {
  const items = [
    item({ id: "1", isOnSale: true }),
    item({ id: "2", isOnSale: false }),
    item({ id: "3", isOnSale: true }),
    item({ id: "4", isOnSale: true }),
  ];

  it("preserva a elegibilidade inteira quando não há teto", () => {
    const result = applyCollectionPools(
      items,
      { newArrivals: { expirationDays: 0, limit: 10 }, promotions: { limit: 0 } },
      NOW,
    );

    expect(result.filter((entry) => entry.isOnSale).map((entry) => entry.id)).toEqual([
      "1",
      "3",
      "4",
    ]);
  });

  it("corta pelo teto sem promover produto que não está em promoção", () => {
    const result = applyCollectionPools(
      items,
      { newArrivals: { expirationDays: 0, limit: 10 }, promotions: { limit: 2 } },
      NOW,
    );

    expect(result.filter((entry) => entry.isOnSale).map((entry) => entry.id)).toEqual(["1", "3"]);
    expect(result.find((entry) => entry.id === "2")?.isOnSale).toBe(false);
  });
});
