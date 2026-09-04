import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildProductsResponse } from "../../../../test/factories/wp-catalog-taxonomy";

const wpGraphqlRequest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-graphql", () => ({ wpGraphqlRequest }));

vi.mock("@/lib/server/env", () => ({
  isMockDataEnabled: () => false,
  getWpGraphqlEndpoint: () => "http://wordpress.test/graphql",
}));

const activeFlashSale = vi.hoisted(() => ({
  current: null as { productIds: number[]; products: unknown[] } | null,
}));

vi.mock("./get-home-flash-sale", () => ({
  getHomeFlashSale: () => Promise.resolve(activeFlashSale.current),
}));

vi.mock("./get-collections-config", () => ({
  getCollectionsConfig: () =>
    Promise.resolve({
      newArrivals: { expirationDays: 0, limit: 10 },
      promotions: { limit: 0 },
    }),
}));

const campaignProduct = {
  id: "11760",
  category: "Papel",
  name: "Seda Tradicional Mini Size",
  badge: "Tradicional",
  discount: 99,
  originalPrice: 90,
  price: 0.9,
  rating: 0,
  reviews: 0,
  image: "",
  promotionContext: "contexto-assinado",
};

async function loadHomeProducts() {
  const homeModule = await import("./get-home-products");
  return homeModule.getHomeProducts;
}

beforeEach(() => {
  vi.resetModules();
  wpGraphqlRequest.mockReset();
  wpGraphqlRequest.mockImplementation(async () => buildProductsResponse());
  activeFlashSale.current = null;
});

describe("getHomeProducts", () => {
  it("projeta o preço da campanha nos cards da home, não só no bloco de oferta", async () => {
    activeFlashSale.current = { productIds: [11760], products: [campaignProduct] };
    const getHomeProducts = await loadHomeProducts();

    const payload = await getHomeProducts();
    const bestSeller = payload.bestSellerProducts.find((card) => card.id === "11760");
    const newArrival = payload.newArrivalProducts.find((card) => card.id === "11760");

    expect(bestSeller).toMatchObject({
      price: 0.9,
      originalPrice: 90,
      discount: 99,
      promotionContext: "contexto-assinado",
    });
    expect(newArrival).toMatchObject({ price: 0.9, originalPrice: 90, discount: 99 });
    expect(
      payload.bestSellerProducts
        .filter((card) => card.id !== "11760")
        .every((card) => card.price === 90),
    ).toBe(true);
  });

  it("mantém o preço regular sem campanha ativa", async () => {
    const getHomeProducts = await loadHomeProducts();

    const payload = await getHomeProducts();

    expect(payload.flashSaleCampaign).toBeNull();
    expect(payload.bestSellerProducts.every((card) => card.price === 90)).toBe(true);
    expect(payload.newArrivalProducts.every((card) => card.discount === 0)).toBe(true);
  });
});
