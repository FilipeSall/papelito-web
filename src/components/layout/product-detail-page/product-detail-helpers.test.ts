import { describe, expect, it } from "vitest";

import type { ProductDetailItem } from "@/features/catalog/types/product-detail";

import { resolveThumbnails } from "./product-detail-helpers";

function product(overrides: Partial<ProductDetailItem> = {}): ProductDetailItem {
  return {
    id: "900",
    name: "Kit Escritório",
    category: "Kit Papelito",
    type: "acessorios",
    badge: "Kit Papelito",
    description: "Resumo",
    image: "/kit.webp",
    rating: 0,
    reviews: 0,
    price: 59.9,
    originalPrice: 59.9,
    discountPercent: 0,
    galleryImages: Array.from({ length: 5 }, (_, index) => ({
      id: `product:${index}`,
      name: `Produto ${index}`,
      image: `/produto-${index}.webp`,
    })),
    relatedThumbs: [],
    ...overrides,
  };
}

describe("resolveThumbnails", () => {
  it("preserva o limite de quatro miniaturas em produtos convencionais", () => {
    expect(resolveThumbnails(product())).toHaveLength(4);
  });

  it("permite todas as imagens únicas de componentes quando o chamador remove o limite", () => {
    expect(resolveThumbnails(product({ isKit: true }), Number.POSITIVE_INFINITY)).toHaveLength(5);
  });
});
