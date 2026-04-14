export const CART_FEATURE_KEY = "cart";

export { useCartStore } from "./store/use-cart-store";
export { useCartSummary } from "./hooks/use-cart-summary";
export {
  CART_COUPON_CODE,
  CART_COUPON_PERCENT,
  CART_SHIPPING_COST,
  CART_SHIPPING_THRESHOLD,
  getCartSummary,
} from "./utils/get-cart-summary";
export { normalizeProductImage } from "./utils/normalize-product-image";
export type { CartItem, CartProductInput, CartSummary } from "./types/cart";
