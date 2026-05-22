import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CartItem,
  CartVendor,
  ResolvedCartProductInput,
} from "../types/cart";
import { CART_COUPON_CODE } from "../utils/get-cart-summary";
import { normalizeProductImage } from "../utils/normalize-product-image";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  addItem: (product: ResolvedCartProductInput, quantity?: number) => void;
  applyVendorToCart: (vendor: CartVendor) => void;
  decreaseItem: (productId: string) => void;
  increaseItem: (productId: string) => void;
  setItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
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

function normalizeCoupon(code: string) {
  return code.trim().toUpperCase();
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

function normalizePersistedState(value: unknown): Partial<CartState> {
  if (!isRecord(value)) {
    return { items: [], couponCode: null };
  }

  const items = Array.isArray(value.items)
    ? value.items
        .map(normalizePersistedItem)
        .filter((item): item is CartItem => item !== null)
    : [];
  const couponCode = typeof value.couponCode === "string" ? value.couponCode : null;

  return { items, couponCode };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
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
        set({ items: [], couponCode: null });
      },
      applyCoupon: (code) => {
        const normalized = normalizeCoupon(code);
        const isValid = normalized === CART_COUPON_CODE;

        set({
          couponCode: isValid ? normalized : null,
        });

        return isValid;
      },
      removeCoupon: () => {
        set({ couponCode: null });
      },
    }),
    {
      name: "papelito-cart-store",
      version: 2,
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => window.localStorage)
          : undefined,
      migrate: (persistedState) => normalizePersistedState(persistedState),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
      }),
    },
  ),
);
