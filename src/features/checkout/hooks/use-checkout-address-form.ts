"use client";

import { useMemo } from "react";
import { useCepLookup } from "./use-cep-lookup";
import { formatZipCode } from "../utils/format-checkout-fields";
import type { CheckoutAddressForm } from "../types/checkout";
import { useCheckoutStore } from "../store/use-checkout-store";

type UseCheckoutAddressFormReturn = {
  form: CheckoutAddressForm;
  isFormValid: boolean;
  cepLoading: boolean;
  cepError: string | null;
  updateField: <Key extends keyof CheckoutAddressForm>(
    key: Key,
    value: CheckoutAddressForm[Key],
  ) => void;
  handleZipCodeChange: (raw: string) => Promise<void>;
  handleNumberChange: (raw: string) => void;
};

export function useCheckoutAddressForm(): UseCheckoutAddressFormReturn {
  const form = useCheckoutStore((state) => state.addressForm);
  const setAddressField = useCheckoutStore((state) => state.setAddressField);
  const patchAddressForm = useCheckoutStore((state) => state.patchAddressForm);

  const { isLoading: cepLoading, error: cepError, fetchCep } = useCepLookup();

  const isFormValid = useMemo(
    () =>
      form.zipCode.replace(/\D/g, "").length === 8 &&
      Boolean(form.street.trim()) &&
      Boolean(form.number.trim()) &&
      Boolean(form.neighborhood.trim()) &&
      Boolean(form.city.trim()) &&
      Boolean(form.state.trim()),
    [form],
  );

  function updateField<Key extends keyof CheckoutAddressForm>(
    key: Key,
    value: CheckoutAddressForm[Key],
  ) {
    setAddressField(key, value);
  }

  async function handleZipCodeChange(raw: string) {
    const formatted = formatZipCode(raw);
    setAddressField("zipCode", formatted);

    const digits = raw.replace(/\D/g, "");
    if (digits.length === 8) {
      const result = await fetchCep(digits);
      if (result) {
        patchAddressForm({
          street: result.street || form.street,
          neighborhood: result.neighborhood || form.neighborhood,
          city: result.city || form.city,
          state: result.state || form.state,
        });
      }
    }
  }

  function handleNumberChange(raw: string) {
    updateField("number", raw.replace(/[^\dA-Za-z]/g, ""));
  }

  return {
    form,
    isFormValid,
    cepLoading,
    cepError,
    updateField,
    handleZipCodeChange,
    handleNumberChange,
  };
}
