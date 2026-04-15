"use client";

import { useMemo } from "react";
import {
  formatCardNumber,
  formatExpiryDate,
} from "../utils/format-checkout-fields";
import type { PaymentForm, PaymentMethod } from "../types/checkout";
import { useCheckoutStore } from "../store/use-checkout-store";

type UseCheckoutPaymentFormReturn = {
  method: PaymentMethod;
  setMethod: (method: PaymentMethod) => void;
  form: PaymentForm;
  canContinue: boolean;
  updateField: <Key extends keyof PaymentForm>(key: Key, value: PaymentForm[Key]) => void;
  handleCardNumberChange: (raw: string) => void;
  handleExpiryDateChange: (raw: string) => void;
  handleCvvChange: (raw: string) => void;
};

export function useCheckoutPaymentForm(): UseCheckoutPaymentFormReturn {
  const method = useCheckoutStore((state) => state.paymentMethod);
  const setMethod = useCheckoutStore((state) => state.setPaymentMethod);
  const form = useCheckoutStore((state) => state.paymentForm);
  const setPaymentField = useCheckoutStore((state) => state.setPaymentField);

  const isCreditCardValid = useMemo(
    () =>
      form.holderName.trim().length >= 3 &&
      form.cardNumber.replace(/\D/g, "").length >= 13 &&
      form.expiryDate.replace(/\D/g, "").length === 4 &&
      form.cvv.replace(/\D/g, "").length >= 3 &&
      Boolean(form.installments),
    [form],
  );

  const canContinue = method === "credit_card" ? isCreditCardValid : true;

  function updateField<Key extends keyof PaymentForm>(key: Key, value: PaymentForm[Key]) {
    setPaymentField(key, value);
  }

  function handleCardNumberChange(raw: string) {
    updateField("cardNumber", formatCardNumber(raw));
  }

  function handleExpiryDateChange(raw: string) {
    updateField("expiryDate", formatExpiryDate(raw));
  }

  function handleCvvChange(raw: string) {
    updateField("cvv", raw.replace(/\D/g, "").slice(0, 4));
  }

  return {
    method,
    setMethod,
    form,
    canContinue,
    updateField,
    handleCardNumberChange,
    handleExpiryDateChange,
    handleCvvChange,
  };
}
