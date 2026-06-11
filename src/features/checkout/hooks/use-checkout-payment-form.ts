"use client";

import { useMemo, useState } from "react";
import {
  formatCardNumber,
  formatExpiryDate,
} from "../utils/format-checkout-fields";
import type { PaymentForm, PaymentMethod } from "../types/checkout";
import { useCheckoutStore } from "../store/use-checkout-store";
import { tokenizeCreditCard } from "../services/tokenize-credit-card";

type CreditCardDraft = {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
};

type UseCheckoutPaymentFormReturn = {
  method: PaymentMethod;
  setMethod: (method: PaymentMethod) => void;
  form: PaymentForm;
  draft: CreditCardDraft;
  canContinue: boolean;
  updateField: <Key extends keyof PaymentForm>(key: Key, value: PaymentForm[Key]) => void;
  handleCardNumberChange: (raw: string) => void;
  handleExpiryDateChange: (raw: string) => void;
  handleCvvChange: (raw: string) => void;
  prepareCardToken: () => Promise<void>;
};

export function useCheckoutPaymentForm(): UseCheckoutPaymentFormReturn {
  const method = useCheckoutStore((state) => state.paymentMethod);
  const setMethod = useCheckoutStore((state) => state.setPaymentMethod);
  const form = useCheckoutStore((state) => state.paymentForm);
  const setPaymentField = useCheckoutStore((state) => state.setPaymentField);
  const patchPaymentForm = useCheckoutStore((state) => state.patchPaymentForm);
  const [draft, setDraft] = useState<CreditCardDraft>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const isCreditCardValid = useMemo(
    () =>
      form.holderName.trim().length >= 3 &&
      draft.cardNumber.replace(/\D/g, "").length >= 13 &&
      draft.expiryDate.replace(/\D/g, "").length === 4 &&
      draft.cvv.replace(/\D/g, "").length >= 3 &&
      Boolean(form.installments),
    [draft, form.holderName, form.installments],
  );

  const hasStoredToken = Boolean(form.cardTokenId);
  const canContinue =
    method === "credit_card" ? hasStoredToken || isCreditCardValid : true;

  function updateField<Key extends keyof PaymentForm>(key: Key, value: PaymentForm[Key]) {
    setPaymentField(key, value);

    if (key === "holderName" || key === "installments") {
      patchPaymentForm({
        cardTokenId: "",
        cardLast4: "",
      });
    }
  }

  function handleCardNumberChange(raw: string) {
    patchPaymentForm({
      cardTokenId: "",
      cardLast4: "",
    });
    setDraft((current) => ({
      ...current,
      cardNumber: formatCardNumber(raw),
    }));
  }

  function handleExpiryDateChange(raw: string) {
    patchPaymentForm({
      cardTokenId: "",
      cardLast4: "",
    });
    setDraft((current) => ({
      ...current,
      expiryDate: formatExpiryDate(raw),
    }));
  }

  function handleCvvChange(raw: string) {
    patchPaymentForm({
      cardTokenId: "",
      cardLast4: "",
    });
    setDraft((current) => ({
      ...current,
      cvv: raw.replace(/\D/g, "").slice(0, 4),
    }));
  }

  async function prepareCardToken() {
    if (method !== "credit_card") {
      return;
    }

    if (form.cardTokenId) {
      return;
    }

    const token = await tokenizeCreditCard({
      holderName: form.holderName,
      cardNumber: draft.cardNumber,
      expiryDate: draft.expiryDate,
      cvv: draft.cvv,
    });

    patchPaymentForm({
      cardTokenId: token.tokenId,
      cardLast4: token.last4,
    });
    setDraft({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    });
  }

  return {
    method,
    setMethod,
    form,
    draft,
    canContinue,
    updateField,
    handleCardNumberChange,
    handleExpiryDateChange,
    handleCvvChange,
    prepareCardToken,
  };
}
