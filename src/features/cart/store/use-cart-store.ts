import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { applyCouponClient } from "@/features/coupons/services/apply-coupon";
import type { CouponApplyResult } from "@/features/coupons/types/coupon";

import type {
  CartCoupon,
  CartItem,
  CartVendor,
  ResolvedCartProductInput,
} from "../types/cart";
import { normalizeProductImage } from "../utils/normalize-product-image";

export interface CartCouponRevalidationResult {
  revalidated: boolean;
  removed: boolean;
  reason?: string;
}

interface CartState {
  items: CartItem[];
  coupon: CartCoupon | null;
  addItem: (product: ResolvedCartProductInput, quantity?: number) => void;
  applyVendorToCart: (vendor: CartVendor) => void;
  decreaseItem: (productId: string) => void;
  increaseItem: (productId: string) => void;
  setItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<CouponApplyResult>;
  revalidateCoupon: () => Promise<CartCouponRevalidationResult>;
  removeCoupon: () => void;
}

function upsertItem(
  items: CartItem[],
  product: ResolvedCartProductInput,
  quantity: number,
): CartItem[] {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const existing = items.find((item) => item.id === product.id);

  if (!existing) {
    return [...items, { ...product, quantity: safeQuantity }];
  }

  return items.map((item) =>
    item.id === product.id
      ? { ...item, ...product, quantity: item.quantity + safeQuantity }
      : item,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePersistedItem(value: unknown): CartItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "string" ? value.id : "";
  const name = typeof value.name === "string" ? value.name : "";
  const price = typeof value.price === "number" ? value.price : Number(value.price);
  const quantity =
    typeof value.quantity === "number" ? value.quantity : Number(value.quantity);
  const vendorId =
    typeof value.vendorId === "number" ? value.vendorId : Number(value.vendorId);
  const vendorName =
    typeof value.vendorName === "string" ? value.vendorName.trim() : "";

  if (
    !id ||
    !name ||
    !Number.isFinite(price) ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isInteger(vendorId) ||
    vendorId <= 0 ||
    !vendorName
  ) {
    return null;
  }

  const originalPrice =
    typeof value.originalPrice === "number"
      ? value.originalPrice
      : value.originalPrice === undefined
        ? undefined
        : Number(value.originalPrice);

  return {
    id,
    name,
    category: typeof value.category === "string" ? value.category : undefined,
    image:
      typeof value.image === "string"
        ? normalizeProductImage(value.image, name)
        : undefined,
    price,
    originalPrice: Number.isFinite(originalPrice) ? originalPrice : undefined,
    quantity: Math.max(1, Math.floor(quantity)),
    vendorId,
    vendorName,
    city: typeof value.city === "string" ? value.city : undefined,
    state: typeof value.state === "string" ? value.state : undefined,
    distanceKm:
      typeof value.distanceKm === "number" && Number.isFinite(value.distanceKm)
        ? value.distanceKm
        : undefined,
    leadTimeDays:
      typeof value.leadTimeDays === "number" && Number.isFinite(value.leadTimeDays)
        ? value.leadTimeDays
        : undefined,
  };
}

function normalizePersistedCoupon(value: unknown): CartCoupon | null {
  if (!isRecord(value)) return null;

  const code = typeof value.code === "string" ? value.code.trim().toUpperCase() : "";
  const discountValue =
    typeof value.discountValue === "number" ? value.discountValue : Number(value.discountValue);
  const discountType =
    value.discountType === "fixed_cart" ? "fixed_cart" : "percent";
  const appliedProductIds = Array.isArray(value.appliedProductIds)
    ? value.appliedProductIds
        .map((id) => (typeof id === "number" ? id : Number(id)))
        .filter((id): id is number => Number.isInteger(id) && id > 0)
    : [];

  if (!code || !Number.isFinite(discountValue) || discountValue < 0) {
    return null;
  }

  return { code, discountValue, discountType, appliedProductIds };
}

function normalizePersistedState(value: unknown): Partial<CartState> {
  if (!isRecord(value)) {
    return { items: [], coupon: null };
  }

  const items = Array.isArray(value.items)
    ? value.items
        .map(normalizePersistedItem)
        .filter((item): item is CartItem => item !== null)
    : [];
  const coupon = normalizePersistedCoupon(value.coupon);

  return { items, coupon };
}

function buildCartItemsPayload(items: CartItem[]) {
  return items
    .map((item) => {
      const productId = Number.parseInt(item.id, 10);
      if (!Number.isInteger(productId) || productId <= 0) return null;
      return {
        productId,
        vendorId: item.vendorId,
        qty: item.quantity,
        price: item.price,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (product, quantity = 1) => {
        const normalizedProduct = {
          ...product,
          image: normalizeProductImage(product.image, product.name),
        };

        set((state) => ({
          items: upsertItem(state.items, normalizedProduct, quantity),
        }));
      },
      applyVendorToCart: (vendor) => {
        set((state) => ({
          items: state.items.map((item) => ({
            ...item,
            ...vendor,
          })),
        }));
      },
      decreaseItem: (productId) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === productId
                ? { ...item, quantity: Math.max(0, item.quantity - 1) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        }));
      },
      increaseItem: (productId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        }));
      },
      setItemQuantity: (productId, quantity) => {
        const safeQuantity = Math.floor(quantity);
        set((state) => ({
          items:
            safeQuantity <= 0
              ? state.items.filter((item) => item.id !== productId)
              : state.items.map((item) =>
                  item.id === productId
                    ? { ...item, quantity: safeQuantity }
                    : item,
                ),
        }));
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },
      clearCart: () => {
        set({ items: [], coupon: null });
      },
      applyCoupon: async (code) => {
        const trimmed = code.trim();
        if (!trimmed) {
          set({ coupon: null });
          return {
            ok: false,
            status: 422,
            errorCode: "papelito_coupon_missing_code",
            message: "Informe um cupom.",
          };
        }

        const result = await applyCouponClient(trimmed, buildCartItemsPayload(get().items));

        if (result.ok) {
          set({
            coupon: {
              code: result.code,
              discountValue: result.discountValue,
              discountType: result.discountType,
              appliedProductIds: result.appliedProductIds,
            },
          });
        } else {
          set({ coupon: null });
        }

        return result;
      },
      revalidateCoupon: async () => {
        const current = get().coupon;
        if (!current) {
          return { revalidated: false, removed: false };
        }

        const cartItems = buildCartItemsPayload(get().items);
        if (cartItems.length === 0) {
          set({ coupon: null });
          return { revalidated: true, removed: true, reason: "empty_cart" };
        }

        const result = await applyCouponClient(current.code, cartItems);

        if (result.ok) {
          set({
            coupon: {
              code: result.code,
              discountValue: result.discountValue,
              discountType: result.discountType,
              appliedProductIds: result.appliedProductIds,
            },
          });
          return { revalidated: true, removed: false };
        }

        set({ coupon: null });
        return { revalidated: true, removed: true, reason: result.errorCode };
      },
      removeCoupon: () => {
        set({ coupon: null });
      },
    }),
    {
      name: "papelito-cart-store",
      version: 3,
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => window.localStorage)
          : undefined,
      migrate: (persistedState) => normalizePersistedState(persistedState),
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
      }),
    },
  ),
);
