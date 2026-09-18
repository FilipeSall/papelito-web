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
  billingAddressForm: CheckoutAddressForm;
  useDeliveryAddressForBilling: boolean;
  paymentMethod: PaymentMethod;
  paymentForm: PaymentForm;
  shippingQuote: CheckoutShippingQuoteState;
  requiresShippingReselection: boolean;
  checkoutAttemptId: string;
  checkoutAttemptFingerprint?: string;
  setAddressField: (field: keyof CheckoutAddressForm, value: string) => void;
  patchAddressForm: (values: Partial<CheckoutAddressForm>) => void;
  setBillingAddressField: (
    field: keyof CheckoutAddressForm,
    value: string,
  ) => void;
  setUseDeliveryAddressForBilling: (value: boolean) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setPaymentField: (field: keyof PaymentForm, value: string) => void;
  patchPaymentForm: (values: Partial<PaymentForm>) => void;
  setShippingQuote: (quote: ShippingQuoteResult | null) => void;
  setSelectedShippingQuote: (quote: ShippingQuoteOption | null) => void;
  clearShippingQuote: () => void;
  setRequiresShippingReselection: (value: boolean) => void;
  rotateCheckoutAttempt: () => void;
  syncCheckoutAttempt: (fingerprint: string) => string;
  resetCheckout: () => void;
}

const INITIAL_SHIPPING_QUOTE: CheckoutShippingQuoteState = {
  quote: null,
  selectedOption: null,
};

/**
 * Mantém apenas a seleção que uma cotação nova consegue reconferir. O estado
 * persistido atravessa deploys e pode ter sido gravado antes do contrato
 * multicarrier; sem `optionKey`, `fingerprint` e centavos não há como provar que
 * a opção continua sendo a mesma, e ela ainda assim liberaria a etapa de revisão.
 */
function revalidatableSelection(
  selectedOption: ShippingQuoteOption | null | undefined,
): ShippingQuoteOption | null {
  if (!selectedOption) {
    return null;
  }

  return typeof selectedOption.optionKey === "string" &&
    typeof selectedOption.fingerprint === "string" &&
    Number.isInteger(selectedOption.customerPriceCents)
    ? selectedOption
    : null;
}

let checkoutAttemptFallbackSequence = 0;

function createCheckoutAttemptId() {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    if (typeof crypto.getRandomValues === "function") {
      const values = new Uint32Array(4);
      crypto.getRandomValues(values);
      return `checkout-${Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("")}`;
    }
  }

  checkoutAttemptFallbackSequence += 1;
  return `checkout-${Date.now()}-${checkoutAttemptFallbackSequence}`;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      addressForm: INITIAL_ADDRESS_FORM,
      billingAddressForm: INITIAL_ADDRESS_FORM,
      useDeliveryAddressForBilling: true,
      paymentMethod: "credit_card",
      paymentForm: INITIAL_PAYMENT_FORM,
      shippingQuote: INITIAL_SHIPPING_QUOTE,
      requiresShippingReselection: false,
      checkoutAttemptId: createCheckoutAttemptId(),
      checkoutAttemptFingerprint: undefined,
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
      setBillingAddressField: (field, value) =>
        set((state) => ({
          billingAddressForm: {
            ...state.billingAddressForm,
            [field]: value,
          },
        })),
      setUseDeliveryAddressForBilling: (value) =>
        set({ useDeliveryAddressForBilling: value }),
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
            selectedOption: quote ? state.shippingQuote.selectedOption : null,
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
      setRequiresShippingReselection: (value) =>
        set({ requiresShippingReselection: value }),
      rotateCheckoutAttempt: () =>
        set({ checkoutAttemptId: createCheckoutAttemptId() }),
      syncCheckoutAttempt: (fingerprint) => {
        let attemptId = "";

        set((state) => {
          if (
            state.checkoutAttemptFingerprint === fingerprint &&
            state.checkoutAttemptId
          ) {
            attemptId = state.checkoutAttemptId;
            return state;
          }

          attemptId = createCheckoutAttemptId();
          return {
            checkoutAttemptId: attemptId,
            checkoutAttemptFingerprint: fingerprint,
          };
        });

        return attemptId;
      },
      resetCheckout: () =>
        set({
          addressForm: INITIAL_ADDRESS_FORM,
          billingAddressForm: INITIAL_ADDRESS_FORM,
          useDeliveryAddressForBilling: true,
          paymentMethod: "credit_card",
          paymentForm: INITIAL_PAYMENT_FORM,
          shippingQuote: INITIAL_SHIPPING_QUOTE,
          requiresShippingReselection: false,
          checkoutAttemptId: createCheckoutAttemptId(),
          checkoutAttemptFingerprint: undefined,
        }),
    }),
    {
      name: "papelito-checkout-store",
      version: 6,
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
          billingAddressForm?: CheckoutAddressForm;
          useDeliveryAddressForBilling?: boolean;
          checkoutAttemptId?: string;
          checkoutAttemptFingerprint?: string;
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
            shippingQuote: {
              quote: state.shippingQuote.quote ?? null,
              selectedOption: revalidatableSelection(state.shippingQuote.selectedOption),
            },
            paymentForm: safePaymentForm,
            billingAddressForm:
              state.billingAddressForm ?? INITIAL_ADDRESS_FORM,
            useDeliveryAddressForBilling:
              state.useDeliveryAddressForBilling !== false,
            checkoutAttemptId:
              typeof state.checkoutAttemptId === "string" &&
              state.checkoutAttemptId.trim()
                ? state.checkoutAttemptId
                : createCheckoutAttemptId(),
            checkoutAttemptFingerprint:
              typeof state.checkoutAttemptFingerprint === "string"
                ? state.checkoutAttemptFingerprint
                : undefined,
          };
        }

        return {
          ...state,
          paymentForm: safePaymentForm,
          billingAddressForm: state.billingAddressForm ?? INITIAL_ADDRESS_FORM,
          useDeliveryAddressForBilling:
            state.useDeliveryAddressForBilling !== false,
          shippingQuote: {
            quote: null,
            selectedOption: revalidatableSelection(state.selectedShippingQuote),
          },
          checkoutAttemptId:
            typeof state.checkoutAttemptId === "string" &&
            state.checkoutAttemptId.trim()
              ? state.checkoutAttemptId
              : createCheckoutAttemptId(),
          checkoutAttemptFingerprint:
            typeof state.checkoutAttemptFingerprint === "string"
              ? state.checkoutAttemptFingerprint
              : undefined,
        };
      },
      partialize: (state) => ({
        addressForm: state.addressForm,
        billingAddressForm: state.billingAddressForm,
        useDeliveryAddressForBilling: state.useDeliveryAddressForBilling,
        paymentMethod: state.paymentMethod,
        paymentForm: state.paymentForm,
        shippingQuote: state.shippingQuote,
        checkoutAttemptId: state.checkoutAttemptId,
        checkoutAttemptFingerprint: state.checkoutAttemptFingerprint,
      }),
    },
  ),
);
