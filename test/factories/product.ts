import type { CartProductInput } from "@/features/cart";

export function buildProduct(
  overrides: Partial<CartProductInput> = {},
): CartProductInput {
  return {
    id: "99",
    category: "Decoracao",
    name: "Produto Papelito",
    image: "/images/products/test-product.jpg",
    price: 29.9,
    originalPrice: 39.9,
    ...overrides,
  };
}
