"use client";

import { useState } from "react";
import {
  REVENDEDOR_DISCOVERY_OPTIONS,
  REVENDEDOR_SOLD_OPTIONS,
  REVENDEDOR_STATE_OPTIONS,
} from "../constants/revendedor-content";
import type {
  RevendedorFormErrors,
  RevendedorFormValues,
  RevendedorSoldOption,
} from "../types/revendedor";
import {
  formatCnpj,
  formatPhone,
  isValidCnpj,
  isValidEmail,
  sanitizeInstagramHandle,
} from "../utils/revendedor-formatters";

type UseRevendedorFormResult = {
  values: RevendedorFormValues;
  errors: RevendedorFormErrors;
  isSubmitted: boolean;
  isSubmitting: boolean;
  stateOptions: typeof REVENDEDOR_STATE_OPTIONS;
  discoveryOptions: typeof REVENDEDOR_DISCOVERY_OPTIONS;
  soldOptions: typeof REVENDEDOR_SOLD_OPTIONS;
  setFieldValue: <Key extends keyof RevendedorFormValues>(
    key: Key,
    value: RevendedorFormValues[Key],
  ) => void;
  setHasSoldPapelito: (value: RevendedorSoldOption) => void;
  handleSubmit: (event?: React.FormEvent<HTMLFormElement>) => Promise<boolean>;
};

const INITIAL_VALUES: RevendedorFormValues = {
  city: "",
  cnpj: "",
  discoveryChannel: "",
  email: "",
  firstName: "",
  hasSoldPapelito: "",
  instagram: "",
  lastName: "",
  phone: "",
  state: "",
  storeName: "",
};

type UseRevendedorFormOptions = {
  initialValues?: Partial<RevendedorFormValues>;
  onValidSubmit?: (values: RevendedorFormValues) => Promise<{ ok: boolean; error?: string }>;
};

/**
 * Centraliza o estado, formatacao e validacao do formulario da landing `/revendedor`.
 */
export function useRevendedorForm(
  options: UseRevendedorFormOptions = {},
): UseRevendedorFormResult {
  const [values, setValues] = useState<RevendedorFormValues>({
    ...INITIAL_VALUES,
    ...options.initialValues,
  });
  const [errors, setErrors] = useState<RevendedorFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setFieldValue<Key extends keyof RevendedorFormValues>(
    key: Key,
    value: RevendedorFormValues[Key],
  ) {
    const nextValue = formatFieldValue(key, value);

    setValues((current) => ({
      ...current,
      [key]: nextValue,
    }));

    setErrors((current) => {
      if (!current[key] && !current.form) return current;

      const nextErrors = { ...current };
      delete nextErrors[key];
      delete nextErrors.form;
      return nextErrors;
    });

    if (isSubmitted) {
      setIsSubmitted(false);
    }
  }

  function setHasSoldPapelito(value: RevendedorSoldOption) {
    setFieldValue("hasSoldPapelito", value);
  }

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const nextErrors = validateValues(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setIsSubmitted(false);
      return false;
    }

    setIsSubmitting(true);
    const result = await options.onValidSubmit?.({
      ...values,
      storeName: values.storeName.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      instagram: values.instagram.trim(),
      city: values.city.trim(),
    });

    setIsSubmitting(false);
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors.form;
      return nextErrors;
    });

    if (result && !result.ok) {
      setErrors((current) => ({
        ...current,
        form: result.error ?? "Nao foi possivel enviar sua triagem.",
      }));
      setIsSubmitted(false);
      return false;
    }

    setIsSubmitted(true);
    return true;
  }

  return {
    values,
    errors,
    isSubmitted,
    isSubmitting,
    stateOptions: REVENDEDOR_STATE_OPTIONS,
    discoveryOptions: REVENDEDOR_DISCOVERY_OPTIONS,
    soldOptions: REVENDEDOR_SOLD_OPTIONS,
    setFieldValue,
    setHasSoldPapelito,
    handleSubmit,
  };
}

function formatFieldValue<Key extends keyof RevendedorFormValues>(
  key: Key,
  value: RevendedorFormValues[Key],
) {
  if (typeof value !== "string") {
    return value;
  }

  switch (key) {
    case "cnpj":
      return formatCnpj(value) as RevendedorFormValues[Key];
    case "phone":
      return formatPhone(value) as RevendedorFormValues[Key];
    case "instagram":
      return sanitizeInstagramHandle(value) as RevendedorFormValues[Key];
    default:
      return value as RevendedorFormValues[Key];
  }
}

function validateValues(values: RevendedorFormValues): RevendedorFormErrors {
  const nextErrors: RevendedorFormErrors = {};

  if (!values.storeName.trim()) nextErrors.storeName = "Informe o nome da loja.";
  if (!values.firstName.trim()) nextErrors.firstName = "Informe o nome do responsável.";
  if (!values.lastName.trim()) nextErrors.lastName = "Informe o sobrenome.";
  if (!isValidCnpj(values.cnpj)) nextErrors.cnpj = "Informe um CNPJ válido.";
  if (values.phone.replace(/\D/g, "").length < 10) {
    nextErrors.phone = "Informe um telefone com DDD.";
  }
  if (!isValidEmail(values.email)) nextErrors.email = "Informe um e-mail válido.";
  if (!values.instagram.trim()) nextErrors.instagram = "Informe o Instagram da loja.";
  if (!values.city.trim()) nextErrors.city = "Informe a cidade.";
  if (!values.state.trim()) nextErrors.state = "Selecione o estado.";
  if (!values.hasSoldPapelito) {
    nextErrors.hasSoldPapelito = "Escolha se você já vende produtos Papelito.";
  }

  return nextErrors;
}
