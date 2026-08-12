import { describe, expect, it } from "vitest";

import {
  applyFlashSaleToCatalogItem,
  applyFlashSaleToHomeProductCard,
  applyFlashSaleToProductDetail,
} from "./apply-flash-sale-to-product";

const campaign = {
  title: "Queimão",
  slug: "queimao",
  status: "active",
  startsAt: "2026-08-04T12:00:00+00:00",
  endsAt: "2026-08-05T12:00:00+00:00",
  productIds: [11794],
  label: "Oferta Relâmpago",
  supportingText: "",
  products: [
    {
      id: "11794",
      category: "Papel",
      name: "Seda Insane Brown King Size",
      badge: "Destaque",
      discount: 99,
      originalPrice: 223,
      price: 2.23,
      rating: 0,
      reviews: 0,
      image: "",
      promotionContext: "signed-context",
    },
  ],
};

describe("applyFlashSaleToProduct", () => {
  it("projeta o preço autoritativo da campanha em todas as vitrines", () => {
    const home = applyFlashSaleToHomeProductCard(
      {
        id: "11794",
        category: "Papel",
        name: "Seda Insane Brown King Size",
        badge: "Destaque",
        discount: 17,
        originalPrice: 223,
        price: 184.9,
        rating: 4.4,
        reviews: 20,
        image: "",
      },
      campaign,
    );
    const catalog = applyFlashSaleToCatalogItem(
      {
        id: "11794",
        category: "Papel",
        name: "Seda Insane Brown King Size",
        badge: "Destaque",
        originalPrice: 223,
        price: 184.9,
        rating: 4.4,
        reviews: 20,
        image: "",
        type: "sedas",
        isPremium: false,
        isNewArrival: false,
        isOnSale: true,
        isKit: false,
        subcategories: [],
      },
      campaign,
    );
    const detail = applyFlashSaleToProductDetail(
      {
        id: "11794",
        category: "Papel",
        name: "Seda Insane Brown King Size",
        badge: "Destaque",
        description: "Produto",
        image: "",
        type: "sedas",
        originalPrice: 223,
        price: 184.9,
        discountPercent: 17,
        rating: 4.4,
        reviews: 20,
        galleryImages: [],
        relatedThumbs: [],
      },
      campaign,
    );

    expect(home).toMatchObject({ discount: 99, originalPrice: 223, price: 2.23 });
    expect(catalog).toMatchObject({ isOnSale: true, originalPrice: 223, price: 2.23 });
    expect(detail).toMatchObject({ discountPercent: 99, originalPrice: 223, price: 2.23 });
    expect([home, catalog, detail].map((product) => product.promotionContext)).toEqual([
      "signed-context",
      "signed-context",
      "signed-context",
    ]);
  });

  it("corrige o preço dos produtos relacionados que estão na campanha", () => {
    const detail = applyFlashSaleToProductDetail(
      {
        id: "11795",
        category: "Papel",
        name: "Outro produto",
        badge: "Destaque",
        description: "Produto",
        image: "",
        type: "sedas",
        originalPrice: 121,
        price: 99.9,
        discountPercent: 17,
        rating: 4.4,
        reviews: 20,
        galleryImages: [],
        relatedThumbs: [
          { id: "11794", name: "Seda Insane Brown King Size", price: 223 },
          { id: "11796", name: "Seda fora da campanha", price: 89.9 },
        ],
      },
      campaign,
    );

    expect(detail.price).toBe(99.9);
    expect(detail.relatedThumbs.map((thumb) => thumb.price)).toEqual([2.23, 89.9]);
  });

  it("preserva o preço do catálogo para produto fora da campanha", () => {
    const product = {
      id: "11795",
      category: "Papel",
      name: "Outro produto",
      badge: "Destaque",
      originalPrice: 121,
      price: 99.9,
      rating: 4.4,
      reviews: 20,
      image: "",
      type: "sedas" as const,
      isPremium: false,
      isNewArrival: false,
      isOnSale: true,
      isKit: false,
      subcategories: [],
    };

    expect(applyFlashSaleToCatalogItem(product, campaign)).toBe(product);
  });
});
