export const CART_FEATURE_KEY = "cart";

export { useCartStore } from "./store/use-cart-store";
export { useCartSummary } from "./hooks/use-cart-summary";
export { useCartCouponRevalidator } from "./hooks/use-cart-coupon-revalidator";
export { useCartStockValidation } from "./hooks/use-cart-stock-validation";
export { useCartPricing } from "./hooks/use-cart-pricing";
export { getCartPricing } from "./services/get-cart-pricing";
export type { CartStockValidationOutcome } from "./hooks/use-cart-stock-validation";
export { getCartStock } from "./services/get-cart-stock";
export type {
  CartStockEntry,
  CartStockItemInput,
  CartStockResult,
} from "./services/get-cart-stock";
export { resolveCartVendor } from "./services/resolve-cart-vendor";
export {
  CART_SHIPPING_COST,
  CART_SHIPPING_THRESHOLD,
  getCartSummary,
} from "./utils/get-cart-summary";
export { normalizeProductImage } from "./utils/normalize-product-image";
export type {
  CartCoupon,
  CartItem,
  CartPricingAdjustment,
  CartPricingLine,
  CartPricingQuote,
  CartProductInput,
  CartSummary,
  CartVendor,
  CartVendorGroup,
  ResolvedCartProductInput,
} from "./types/cart";
export type {
  ResolveCartVendorResult,
  ResolveCartVendorStatus,
} from "./services/resolve-cart-vendor";
