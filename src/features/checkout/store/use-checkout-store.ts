"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CheckoutAddressForm,
  PaymentForm,
  PaymentMethod,
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
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  installments: "",
};

interface CheckoutState {
  addressForm: CheckoutAddressForm;
  paymentMethod: PaymentMethod;
  paymentForm: PaymentForm;
  selectedShippingQuote: ShippingQuoteOption | null;
  setAddressField: (field: keyof CheckoutAddressForm, value: string) => void;
  patchAddressForm: (values: Partial<CheckoutAddressForm>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setPaymentField: (field: keyof PaymentForm, value: string) => void;
  setSelectedShippingQuote: (quote: ShippingQuoteOption | null) => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      addressForm: INITIAL_ADDRESS_FORM,
      paymentMethod: "credit_card",
      paymentForm: INITIAL_PAYMENT_FORM,
      selectedShippingQuote: null,
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
      setSelectedShippingQuote: (quote) => set({ selectedShippingQuote: quote }),
      resetCheckout: () =>
        set({
          addressForm: INITIAL_ADDRESS_FORM,
          paymentMethod: "credit_card",
          paymentForm: INITIAL_PAYMENT_FORM,
          selectedShippingQuote: null,
        }),
    }),
    {
      name: "papelito-checkout-store",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => window.localStorage)
          : undefined,
      partialize: (state) => ({
        addressForm: state.addressForm,
        paymentMethod: state.paymentMethod,
        paymentForm: state.paymentForm,
        selectedShippingQuote: state.selectedShippingQuote,
      }),
    },
  ),
);
