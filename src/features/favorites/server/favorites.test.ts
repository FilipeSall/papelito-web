import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchFavorites } from "./favorites";

const wpGraphqlRequest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-graphql", () => ({ wpGraphqlRequest }));

const activeFlashSale = vi.hoisted(() => ({
  current: null as { productIds: number[]; products: unknown[] } | null,
}));

vi.mock("@/features/catalog/services/get-home-flash-sale", () => ({
  getHomeFlashSale: () => Promise.resolve(activeFlashSale.current),
}));

const campaignProduct = {
  id: "11794",
  category: "Papel",
  name: "Seda Insane Brown King Size",
  badge: "Premium",
  discount: 99,
  originalPrice: 223,
  price: 2.23,
  rating: 0,
  reviews: 0,
  image: "",
  promotionContext: "contexto-assinado",
};

function favoritesResponse() {
  return {
    customer: {
      favoritesCount: 2,
      favorites: [
        {
          productId: 11794,
          addedAt: "2026-08-01T10:00:00",
          product: {
            databaseId: 11794,
            name: "Seda Insane Brown King Size",
            slug: "seda-insane-brown-king-size",
            price: "R$ 223,00",
            regularPrice: "R$ 223,00",
            salePrice: null,
            stockStatus: "IN_STOCK",
          },
        },
        {
          productId: 11795,
          addedAt: "2026-08-01T11:00:00",
          product: {
            databaseId: 11795,
            name: "Seda fora da campanha",
            slug: "seda-fora-da-campanha",
            price: "R$ 89,90",
            regularPrice: "R$ 89,90",
            salePrice: null,
            stockStatus: "IN_STOCK",
          },
        },
      ],
    },
  };
}

beforeEach(() => {
  wpGraphqlRequest.mockReset();
  wpGraphqlRequest.mockResolvedValue(favoritesResponse());
  activeFlashSale.current = null;
});

describe("fetchFavorites", () => {
  it("exibe o preço da campanha e carrega o contexto promocional para o carrinho", async () => {
    activeFlashSale.current = { productIds: [11794], products: [campaignProduct] };

    const payload = await fetchFavorites("token");

    expect(payload.items[0]).toMatchObject({
      productId: "11794",
      price: 2.23,
      originalPrice: 223,
      promotionContext: "contexto-assinado",
    });
    expect(payload.items[1]).toMatchObject({ productId: "11795", price: 89.9 });
    expect(payload.items[1].promotionContext).toBeUndefined();
  });

  it("mantém o preço regular sem campanha ativa", async () => {
    const payload = await fetchFavorites("token");

    expect(payload.items.map((item) => item.price)).toEqual([223, 89.9]);
    expect(payload.items.every((item) => item.promotionContext === undefined)).toBe(true);
  });
});
