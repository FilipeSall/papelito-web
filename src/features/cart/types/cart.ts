export interface CartProductInput {
  id: string;
  name: string;
  category?: string;
  image?: string;
  price: number;
  originalPrice?: number;
  promotionContext?: string;
}

export interface CartVendor {
  vendorId: number;
  vendorName: string;
  city?: string;
  state?: string;
  distanceKm?: number;
  leadTimeDays?: number;
}

export interface ResolvedCartProductInput extends CartProductInput, CartVendor {
}

export interface CartItem extends ResolvedCartProductInput {
  quantity: number;
}

export interface CartVendorGroup extends CartVendor {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export interface CartCoupon {
  code: string;
  discountValue: number;
  discountType: "percent" | "fixed_cart";
  appliedProductIds: number[];
  applied?: boolean;
  message?: string;
}

export interface CartPricingLine {
  productId: number;
  vendorId: number;
  qty: number;
  normalUnitCents: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  discountSource: "none" | "coupon" | "flash_sale";
  promotionContext: string;
}

export interface CartPricingAdjustment {
  type: string;
  productId?: number;
  code?: string;
  message: string;
}

export interface CartPricingQuote {
  lines: CartPricingLine[];
  coupon: {
    code: string;
    discountType: "percent" | "fixed_cart";
    discountValueCents: number;
    appliedProductIds: number[];
    applied: boolean;
    message?: string;
  } | null;
  adjustments: CartPricingAdjustment[];
  totals: {
    subtotalCents: number;
    discountCents: number;
    itemsCents: number;
    shippingCents: number;
    totalCents: number;
  };
  paymentRestrictions: {
    creditCardMinimumCents: number;
    pixMinimumCents: number;
    boletoMinimumCents: number;
    installmentMinimumCents: number;
    maxInstallments: number;
  };
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  totalItems: number;
  vendorGroups: CartVendorGroup[];
  amountToFreeShipping: number;
  hasFreeShipping: boolean;
  coupon: CartCoupon | null;
}
