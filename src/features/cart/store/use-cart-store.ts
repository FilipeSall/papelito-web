import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem, CartProductInput } from "../types/cart";
import { CART_COUPON_CODE } from "../utils/get-cart-summary";
import { normalizeProductImage } from "../utils/normalize-product-image";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  addItem: (product: CartProductInput, quantity?: number) => void;
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
  product: CartProductInput,
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
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => window.localStorage)
          : undefined,
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
      }),
    },
  ),
);
