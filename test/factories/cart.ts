import type {
  CartCoupon,
  CartItem,
  CartVendor,
  ResolvedCartProductInput,
} from "@/features/cart";

export function buildCartVendor(overrides: Partial<CartVendor> = {}): CartVendor {
  return {
    vendorId: 101,
    vendorName: "Vendor Centro",
    city: "Sao Paulo",
    state: "SP",
    distanceKm: 12,
    leadTimeDays: 2,
    ...overrides,
  };
}

export function buildResolvedCartProduct(
  overrides: Partial<ResolvedCartProductInput> = {},
): ResolvedCartProductInput {
  return {
    id: "1",
    name: "Produto Papelito",
    category: "Decoracao",
    image: "/images/products/test-product.jpg",
    price: 49.5,
    originalPrice: 59.9,
    ...buildCartVendor(),
    ...overrides,
  };
}

export function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    ...buildResolvedCartProduct(),
    quantity: 1,
    ...overrides,
  };
}

export function buildCartCoupon(overrides: Partial<CartCoupon> = {}): CartCoupon {
  return {
    code: "PAPELITO10",
    discountType: "fixed_cart",
    discountValue: 10,
    appliedProductIds: [1],
    ...overrides,
  };
}
