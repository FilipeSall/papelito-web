export type CouponDiscountType = "percent" | "fixed_cart";

export type CouponRole = "customer" | "any";

export type CouponStatus = "publish" | "draft";

export type Coupon = {
  id: number;
  code: string;
  status: CouponStatus;
  discountType: CouponDiscountType;
  amount: number;
  dateExpires: string | null;
  usageLimit: number;
  usageLimitPerUser: number;
  minimumAmount: number;
  usageCount: number;
  role: CouponRole;
  vendorIds: number[];
  productIds: number[];
};

export type CouponInput = {
  code: string;
  discountType: CouponDiscountType;
  amount: number;
  dateExpires: string | null;
  usageLimit: number;
  usageLimitPerUser: number;
  minimumAmount: number;
  role: CouponRole;
  vendorIds: number[];
  productIds: number[];
  status: CouponStatus;
};

export type CouponListSnapshot = {
  items: Coupon[];
  total: number;
  page: number;
  perPage: number;
};

export type CouponListFilters = {
  status?: "any" | CouponStatus;
  search?: string;
  page?: number;
  perPage?: number;
};

export type CouponApplyCartItem = {
  productId: number;
  vendorId: number;
  qty: number;
  price: number;
  promotionContext?: string;
};

export type CouponApplyRequest = {
  code: string;
  cartItems: CouponApplyCartItem[];
};

export type CouponApplySuccess = {
  ok: true;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  appliedProductIds: number[];
  applied?: boolean;
  message?: string;
};

export type CouponApplyFailure = {
  ok: false;
  status: number;
  errorCode: string;
  message: string;
};

export type CouponApplyResult = CouponApplySuccess | CouponApplyFailure;
