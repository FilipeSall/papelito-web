"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CheckoutShippingQuoteState,
  CheckoutAddressForm,
  PaymentForm,
  PaymentMethod,
  ShippingQuoteResult,
  ShippingQuoteOption,
} from "../types/checkout";

const INITIAL_ADDRESS_FORM: CheckoutAddressForm = {
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const INITIAL_PAYMENT_FORM: PaymentForm = {
  holderName: "",
  installments: "",
  cardTokenId: "",
  cardLast4: "",
};

interface CheckoutState {
  addressForm: CheckoutAddressForm;
  paymentMethod: PaymentMethod;
  paymentForm: PaymentForm;
  shippingQuote: CheckoutShippingQuoteState;
  checkoutAttemptId: string;
  setAddressField: (field: keyof CheckoutAddressForm, value: string) => void;
  patchAddressForm: (values: Partial<CheckoutAddressForm>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setPaymentField: (field: keyof PaymentForm, value: string) => void;
  patchPaymentForm: (values: Partial<PaymentForm>) => void;
  setShippingQuote: (quote: ShippingQuoteResult | null) => void;
  setSelectedShippingQuote: (quote: ShippingQuoteOption | null) => void;
  clearShippingQuote: () => void;
  rotateCheckoutAttempt: () => void;
  resetCheckout: () => void;
}

const INITIAL_SHIPPING_QUOTE: CheckoutShippingQuoteState = {
  quote: null,
  selectedOption: null,
};

function createCheckoutAttemptId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      addressForm: INITIAL_ADDRESS_FORM,
      paymentMethod: "credit_card",
      paymentForm: INITIAL_PAYMENT_FORM,
      shippingQuote: INITIAL_SHIPPING_QUOTE,
      checkoutAttemptId: createCheckoutAttemptId(),
      setAddressField: (field, value) =>
        set((state) => ({
          addressForm: {
            ...state.addressForm,
            [field]: value,
          },
        })),
      patchAddressForm: (values) =>
        set((state) => ({
          addressForm: {
            ...state.addressForm,
            ...values,
          },
        })),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setPaymentField: (field, value) =>
        set((state) => ({
          paymentForm: {
            ...state.paymentForm,
            [field]: value,
          },
        })),
      patchPaymentForm: (values) =>
        set((state) => ({
          paymentForm: {
            ...state.paymentForm,
            ...values,
          },
        })),
      setShippingQuote: (quote) =>
        set((state) => ({
          shippingQuote: {
            quote,
            selectedOption: quote
              ? state.shippingQuote.selectedOption
              : null,
          },
        })),
      setSelectedShippingQuote: (quote) =>
        set((state) => ({
          shippingQuote: {
            quote: state.shippingQuote.quote,
            selectedOption: quote,
          },
        })),
      clearShippingQuote: () => set({ shippingQuote: INITIAL_SHIPPING_QUOTE }),
      rotateCheckoutAttempt: () =>
        set({ checkoutAttemptId: createCheckoutAttemptId() }),
      resetCheckout: () =>
        set({
          addressForm: INITIAL_ADDRESS_FORM,
          paymentMethod: "credit_card",
          paymentForm: INITIAL_PAYMENT_FORM,
          shippingQuote: INITIAL_SHIPPING_QUOTE,
          checkoutAttemptId: createCheckoutAttemptId(),
        }),
    }),
    {
      name: "papelito-checkout-store",
      version: 3,
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => window.localStorage)
          : undefined,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState;
        }

        const state = persistedState as {
          selectedShippingQuote?: ShippingQuoteOption | null;
          shippingQuote?: CheckoutShippingQuoteState;
          paymentForm?: Partial<PaymentForm>;
          checkoutAttemptId?: string;
        };

        const safePaymentForm: PaymentForm = {
          holderName:
            typeof state.paymentForm?.holderName === "string"
              ? state.paymentForm.holderName
              : "",
          installments:
            typeof state.paymentForm?.installments === "string"
              ? state.paymentForm.installments
              : "",
          cardTokenId:
            typeof state.paymentForm?.cardTokenId === "string"
              ? state.paymentForm.cardTokenId
              : "",
          cardLast4:
            typeof state.paymentForm?.cardLast4 === "string"
              ? state.paymentForm.cardLast4
              : "",
        };

        if (state.shippingQuote) {
          return {
            ...state,
            paymentForm: safePaymentForm,
            checkoutAttemptId:
              typeof state.checkoutAttemptId === "string" &&
              state.checkoutAttemptId.trim()
                ? state.checkoutAttemptId
                : createCheckoutAttemptId(),
          };
        }

        return {
          ...state,
          paymentForm: safePaymentForm,
          shippingQuote: {
            quote: null,
            selectedOption: state.selectedShippingQuote ?? null,
          },
          checkoutAttemptId:
            typeof state.checkoutAttemptId === "string" &&
            state.checkoutAttemptId.trim()
              ? state.checkoutAttemptId
              : createCheckoutAttemptId(),
        };
      },
      partialize: (state) => ({
        addressForm: state.addressForm,
        paymentMethod: state.paymentMethod,
        paymentForm: state.paymentForm,
        shippingQuote: state.shippingQuote,
        checkoutAttemptId: state.checkoutAttemptId,
      }),
    },
  ),
);
