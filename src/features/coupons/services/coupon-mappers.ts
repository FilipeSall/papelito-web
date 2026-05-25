import "server-only";

import type {
  Coupon,
  CouponInput,
  CouponListSnapshot,
} from "../types/coupon";

type WpCoupon = {
  id?: number;
  code?: string;
  status?: string;
  discount_type?: string;
  amount?: number;
  date_expires?: string | null;
  usage_limit?: number;
  usage_limit_per_user?: number;
  minimum_amount?: number;
  usage_count?: number;
  role?: string;
  vendor_ids?: number[];
  product_ids?: number[];
};

type WpCouponList = {
  items?: WpCoupon[];
  total?: number;
  page?: number;
  perPage?: number;
};

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toIntArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "number" ? entry : Number(entry)))
    .filter((entry): entry is number => Number.isInteger(entry) && entry > 0);
}

export function mapWpCoupon(raw: WpCoupon | null | undefined): Coupon | null {
  if (!raw || typeof raw.id !== "number" || raw.id <= 0) {
    return null;
  }

  const discountType = raw.discount_type === "fixed_cart" ? "fixed_cart" : "percent";
  const status = raw.status === "draft" ? "draft" : "publish";
  const role = raw.role === "any" ? "any" : "customer";

  return {
    id: raw.id,
    code: typeof raw.code === "string" ? raw.code : "",
    status,
    discountType,
    amount: toNumber(raw.amount),
    dateExpires: typeof raw.date_expires === "string" && raw.date_expires.length > 0 ? raw.date_expires : null,
    usageLimit: toNumber(raw.usage_limit),
    usageLimitPerUser: toNumber(raw.usage_limit_per_user),
    minimumAmount: toNumber(raw.minimum_amount),
    usageCount: toNumber(raw.usage_count),
    role,
    vendorIds: toIntArray(raw.vendor_ids),
    productIds: toIntArray(raw.product_ids),
  };
}

export function mapWpCouponList(raw: WpCouponList | null | undefined): CouponListSnapshot {
  const items = Array.isArray(raw?.items)
    ? raw.items.map(mapWpCoupon).filter((entry): entry is Coupon => entry !== null)
    : [];

  return {
    items,
    total: toNumber(raw?.total),
    page: Math.max(1, toNumber(raw?.page) || 1),
    perPage: Math.max(1, toNumber(raw?.perPage) || items.length || 20),
  };
}

export function toWpCouponPayload(input: CouponInput): Record<string, unknown> {
  return {
    code: input.code,
    discount_type: input.discountType,
    amount: input.amount,
    date_expires: input.dateExpires ?? "",
    usage_limit: input.usageLimit,
    usage_limit_per_user: input.usageLimitPerUser,
    minimum_amount: input.minimumAmount,
    role: input.role,
    vendor_ids: input.vendorIds,
    product_ids: input.productIds,
    status: input.status,
  };
}
