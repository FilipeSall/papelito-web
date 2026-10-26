"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  CADASTRO_STEP1_ERROR_KEY,
  CADASTRO_STORAGE_KEY,
  readCompanyApplicationStep1Errors,
  REVENDEDOR_STEP1_DRAFT_KEY,
} from "@/features/company-application";
import type {
  RevendedorSignupErrors,
  RevendedorSignupField,
  RevendedorSignupValues,
} from "@/features/revendedor";
import {
  createEmptyRevendedorSignup,
  patchRevendedorSignupField,
  REVENDEDOR_SIGNUP_FIELDS,
  revendedorErrorsFromStep1,
  revendedorSignupToStep1,
  validateRevendedorSignup,
} from "@/features/revendedor/utils/revendedor-signup";

const STEP2_PATH = "/cadastro/etapa-2";

function readDraft(): RevendedorSignupValues | null {
  const saved = window.sessionStorage.getItem(REVENDEDOR_STEP1_DRAFT_KEY);
  if (!saved) return null;
  try {
    return { ...createEmptyRevendedorSignup(), ...(JSON.parse(saved) as Partial<RevendedorSignupValues>) };
  } catch {
    return null;
  }
}

function persistDraft(values: RevendedorSignupValues) {
  const hasContent = Object.values(values).some((value) => value !== "");
  if (hasContent) {
    window.sessionStorage.setItem(REVENDEDOR_STEP1_DRAFT_KEY, JSON.stringify(values));
  } else {
    window.sessionStorage.removeItem(REVENDEDOR_STEP1_DRAFT_KEY);
  }
}

function readReturnedErrors(): RevendedorSignupErrors {
  const errors = revendedorErrorsFromStep1(
    readCompanyApplicationStep1Errors([
      "name",
      "email",
      "phone",
      "cpf",
      "cnpj",
      "birthDate",
      "storeName",
      "instagram",
      "discoveryChannel",
      "hasSoldPapelito",
    ]),
  );
  window.sessionStorage.removeItem(CADASTRO_STEP1_ERROR_KEY);
  return errors;
}

function focusFirstError(errors: RevendedorSignupErrors) {
  const field = REVENDEDOR_SIGNUP_FIELDS.find((key) => errors[key]);
  if (field) document.getElementById(field)?.focus();
}

/**
 * Estado do formulário do `/revendedor` como etapa 1 do cadastro de empresa compradora.
 *
 * Nada vai ao servidor aqui: "Avançar" valida, grava a etapa 1 no `sessionStorage` e abre a
 * `/cadastro/etapa-2`. O rascunho e os erros que a etapa 2 devolve só são lidos depois de montar,
 * porque a página é renderizada no servidor e o primeiro render precisa ser igual ao do HTML.
 */
export function useRevendedorSignup() {
  const router = useRouter();
  const [values, setValues] = useState<RevendedorSignupValues>(createEmptyRevendedorSignup);
  const [errors, setErrors] = useState<RevendedorSignupErrors>({});
  const [isNavigating, setIsNavigating] = useState(false);
  const valuesRef = useRef(values);
  const submittedRef = useRef(false);

  useEffect(() => {
    const draft = readDraft();
    const returned = readReturnedErrors();
    if (draft) {
      valuesRef.current = draft;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration from sessionStorage on mount
      setValues(draft);
    }
    if (Object.keys(returned).length > 0) {
      setErrors(returned);
      focusFirstError(returned);
    }
  }, []);

  useEffect(() => {
    function persistOnLeave() {
      if (!submittedRef.current) persistDraft(valuesRef.current);
    }

    window.addEventListener("pagehide", persistOnLeave);
    return () => {
      window.removeEventListener("pagehide", persistOnLeave);
      persistOnLeave();
    };
  }, []);

  function handleChange(key: RevendedorSignupField, rawValue: string) {
    const next = patchRevendedorSignupField(valuesRef.current, key, rawValue);
    valuesRef.current = next;
    setValues(next);
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  function advance() {
    if (isNavigating) return;

    const nextErrors = validateRevendedorSignup(valuesRef.current);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }

    submittedRef.current = true;
    setIsNavigating(true);
    window.sessionStorage.setItem(CADASTRO_STORAGE_KEY, JSON.stringify(revendedorSignupToStep1(valuesRef.current)));
    persistDraft(valuesRef.current);
    router.push(STEP2_PATH);
  }

  return { advance, errors, handleChange, isNavigating, values };
}
