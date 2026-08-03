import { describe, expect, it } from "vitest";

import { applyFlashSaleToProductDetail } from "./apply-flash-sale-to-product-detail";

const product = {
  id: "11776",
  name: "Seda Slim King Size",
  category: "Papel",
  type: "sedas" as const,
  badge: "Destaque",
  description: "Produto",
  rating: 4.4,
  reviews: 10,
  price: 99.9,
  originalPrice: 121,
  discountPercent: 17,
  galleryImages: [],
  relatedThumbs: [],
};

describe("applyFlashSaleToProductDetail", () => {
  it("faz a campanha ativa prevalecer sobre o preço promocional normal", () => {
    const result = applyFlashSaleToProductDetail(product, {
      title: "Oferta Relâmpago",
      slug: "oferta-relampago",
      status: "active",
      startsAt: "2026-08-03T12:00:00+00:00",
      endsAt: "2026-08-04T12:00:00+00:00",
      productIds: [11776],
      label: "Oferta Relâmpago",
      supportingText: "",
      products: [
        {
          id: "11776",
          category: "Papel",
          name: "Seda Slim King Size",
          badge: "Destaque",
          discount: 99,
          originalPrice: 121,
          price: 1.21,
          rating: 4.4,
          reviews: 10,
          image: "",
          promotionContext: "signed-context",
        },
      ],
    });

    expect(result).toMatchObject({
      originalPrice: 121,
      price: 1.21,
      discountPercent: 99,
      promotionContext: "signed-context",
    });
  });

  it("mantém o preço normal quando o produto não pertence à campanha", () => {
    expect(applyFlashSaleToProductDetail(product, null)).toBe(product);
  });
});
