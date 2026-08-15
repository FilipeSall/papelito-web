"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ChangeEvent, type SubmitEvent, useEffect, useRef, useState } from "react";

import {
  ArrowRightIcon,
  AuthSocialButton,
  AuthSubmitButton,
} from "@/components/auth/atoms";
import { AuthSocialDivider, AuthTextField } from "@/components/auth/molecules";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import { ToastCloseButton } from "@/components/ui/toast-close-button";
import { formatCpf } from "@/features/revendedor/utils/revendedor-registration";
import { formatCnpj, isValidCnpj, isValidCpf } from "@/lib/validation/brazilian-documents";
import { getMaximumAdultBirthDate, validateAdultBirthDate } from "@/lib/validation/birth-date";
import { validateFullName, validatePhone } from "@/lib/validation/person";

import {
  CADASTRO_STEP1_DRAFT_KEY,
  CADASTRO_STEP1_ERROR_KEY,
  CADASTRO_STORAGE_KEY,
  type CadastroIntent,
  type CadastroStep1Data,
  type CadastroStep1Draft,
  type CadastroStep1Errors,
  type CadastroStep1Field,
} from "./shared";

const benefits = [
  "Descontos exclusivos para membros",
  "Frete grátis nas primeiras compras",
  "Acesso antecipado a novidades",
  "Programa de pontos e recompensas",
];

function handleCpfChange(event: ChangeEvent<HTMLInputElement>) {
  event.currentTarget.value = formatCpf(event.currentTarget.value);
}

function formDataString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

const cadastroStep1Fields: CadastroStep1Field[] = [
  "name",
  "email",
  "phone",
  "cpf",
  "cnpj",
  "birthDate",
];

function readStep1Errors(): CadastroStep1Errors {
  if (typeof window === "undefined") return {};

  const saved = window.sessionStorage.getItem(CADASTRO_STEP1_ERROR_KEY);
  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved) as Record<string, unknown>;
    return cadastroStep1Fields.reduce<CadastroStep1Errors>((errors, field) => {
      if (typeof parsed[field] === "string" && parsed[field]) {
        errors[field] = parsed[field];
      }
      return errors;
    }, {});
  } catch {
    return {};
  }
}

function validateStep1(
  payload: CadastroStep1Data,
  emailIsInvalid: boolean,
): CadastroStep1Errors {
  const errors: CadastroStep1Errors = {};

  const nameError = validateFullName(payload.name);
  if (nameError) errors.name = nameError;
  if (!payload.email) {
    errors.email = "Informe seu e-mail.";
  } else if (emailIsInvalid) {
    errors.email = "Informe um e-mail válido.";
  }
  const phoneError = validatePhone(payload.phone);
  if (phoneError) errors.phone = phoneError;
  if (!isValidCpf(payload.cpf)) errors.cpf = "Informe um CPF válido.";
  if (!isValidCnpj(payload.cnpj)) errors.cnpj = "Informe um CNPJ válido.";
  if (!payload.birthDate) {
    errors.birthDate = "Informe sua data de nascimento.";
  } else {
    const birthDateError = validateAdultBirthDate(payload.birthDate);
    if (birthDateError) errors.birthDate = birthDateError;
  }

  return errors;
}

function CadastroPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const googleRegistrationTicket = searchParams.get("googleRegistration");

  const submittedRef = useRef(false);
  const [draft] = useState<CadastroStep1Draft>(() => {
    if (typeof window === "undefined") return {};
    const saved = window.sessionStorage.getItem(CADASTRO_STEP1_DRAFT_KEY);
    if (!saved) return {};
    try {
      return JSON.parse(saved) as CadastroStep1Draft;
    } catch {
      return {};
    }
  });

  // Colaboradores entram apenas pelo fluxo de convite por e-mail.
  const intent: CadastroIntent = "create_company";
  const [fieldErrors, setFieldErrors] = useState<CadastroStep1Errors>(readStep1Errors);
  const [googleAccountFeedbackVisible, setGoogleAccountFeedbackVisible] = useState(
    () => searchParams.get("feedback") === "google_account_required",
  );
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  const intentRef = useRef(intent);
  const shouldFocusErrorRef = useRef(true);

  useEffect(() => {
    intentRef.current = intent;
  }, [intent]);

  useEffect(() => {
    window.sessionStorage.removeItem(CADASTRO_STEP1_ERROR_KEY);
  }, []);

  useEffect(() => {
    if (!shouldFocusErrorRef.current) return;

    const firstField = cadastroStep1Fields.find((field) => fieldErrors[field]);
    if (!firstField) return;

    document.getElementById(firstField)?.focus();
    shouldFocusErrorRef.current = false;
  }, [fieldErrors]);

  const valuesRef = useRef<Record<string, string>>({
    birthDate: draft.birthDate ?? "",
    cnpj: draft.cnpj ?? "",
    cpf: draft.cpf ?? "",
    name: draft.name ?? "",
    email: draft.email ?? "",
    phone: draft.phone ?? "",
  });

  function handleFormChange(event: React.ChangeEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.name) return;
    valuesRef.current = { ...valuesRef.current, [target.name]: target.value };
    if (!cadastroStep1Fields.includes(target.name as CadastroStep1Field)) return;
    setFieldErrors((current) => {
      if (!current[target.name as CadastroStep1Field]) return current;
      const next = { ...current };
      delete next[target.name as CadastroStep1Field];
      return next;
    });
  }

  useEffect(() => {
    function persistDraft() {
      if (submittedRef.current) return;
      const entry: CadastroStep1Draft = {
        ...valuesRef.current,
        intent: intentRef.current,
      };
      const hasContent = Object.entries(entry).some(
        ([key, value]) => key !== "intent" && value !== "",
      );
      if (!hasContent) {
        window.sessionStorage.removeItem(CADASTRO_STEP1_DRAFT_KEY);
        return;
      }
      window.sessionStorage.setItem(CADASTRO_STEP1_DRAFT_KEY, JSON.stringify(entry));
    }

    window.addEventListener("pagehide", persistDraft);
    return () => {
      window.removeEventListener("pagehide", persistDraft);
      persistDraft();
    };
  }, []);

  useEffect(() => {
    if (!googleAccountFeedbackVisible) return;
    const timeoutId = window.setTimeout(() => setGoogleAccountFeedbackVisible(false), 7000);
    return () => window.clearTimeout(timeoutId);
  }, [googleAccountFeedbackVisible]);

  useEffect(() => {
    if (!googleRegistrationTicket) {
      return;
    }
    void fetch(`/api/cadastro/google-email?ticket=${encodeURIComponent(googleRegistrationTicket)}`, { cache: "no-store" })
      .then(async (response) => (response.ok ? (response.json() as Promise<{ email?: unknown }>) : null))
      .then((body) => {
        if (typeof body?.email !== "string" || !body.email) return;
        setGoogleEmail(body.email);
        valuesRef.current = { ...valuesRef.current, email: body.email };
      })
      .catch(() => undefined);
  }, [googleRegistrationTicket]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cpf = formatCpf(formDataString(formData, "cpf")).trim();
    const cnpj = formatCnpj(formDataString(formData, "cnpj")).trim();
    const payload: CadastroStep1Data = {
      birthDate: formDataString(formData, "birthDate"),
      cnpj,
      cpf,
      name: formDataString(formData, "name").trim(),
      email: formDataString(formData, "email").trim(),
      phone: formDataString(formData, "phone").trim(),
      intent,
    };

    const emailInput = event.currentTarget.elements.namedItem("email");
    const emailIsInvalid = !googleEmail
      && emailInput instanceof HTMLInputElement
      && emailInput.validity.typeMismatch;
    const errors = validateStep1(payload, emailIsInvalid);
    if (Object.keys(errors).length > 0) {
      shouldFocusErrorRef.current = true;
      setFieldErrors(errors);
      return;
    }

    submittedRef.current = true;
    window.sessionStorage.setItem(CADASTRO_STORAGE_KEY, JSON.stringify(payload));
    window.sessionStorage.setItem(CADASTRO_STEP1_DRAFT_KEY, JSON.stringify(payload));
    router.push(
      callbackUrl
        ? `/cadastro/etapa-2?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/cadastro/etapa-2",
    );
  }

  return (
    <div className="flex min-h-screen">
      {googleAccountFeedbackVisible ? (
        <GoogleAccountFeedbackToast onClose={() => setGoogleAccountFeedbackVisible(false)} />
      ) : null}
      <div className="relative hidden items-center justify-center bg-brand-yellow lg:flex lg:h-screen lg:w-1/2 lg:sticky lg:top-0">
        <div className="flex flex-col items-center text-center px-12">
          <Link
            href="/"
            aria-label="Ir para a página inicial"
            className="mb-8 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-dark"
          >
            <Image
              src="/images/auth/logo-with-flag.svg"
              alt="Marketplace Papelito"
              width={304}
              height={182}
              priority
            />
          </Link>
          <h1 className="text-2xl font-semibold text-brand-dark tracking-tight">
            SEJA NOSSO CLIENTE
          </h1>
          <p className="mt-2 text-lg text-brand-dark/70 leading-7">
            Junte-se a mais de 100 mil Pontos de Venda
          </p>

          <ul className="mt-10 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-brand-dark rounded-full">
                  <CheckIcon className="w-3 h-3 text-brand-yellow" />
                </span>
                <span className="text-sm font-medium text-brand-dark">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-brand-dark flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-brand-yellow rounded-full text-xs font-black text-brand-dark">
                1
              </span>
              <div className="w-6 h-px bg-white/20" />
            </div>
            <span className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full text-xs font-black text-white/40">
              2
            </span>
            <span className="ml-2 text-xs text-white/40">Etapa 1 de 2</span>
          </div>

          <h2 className="text-3xl font-black text-white uppercase tracking-wide">
            Criar Conta
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Já tem uma conta?{" "}
            <Link
              href={callbackUrl ? `/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/entrar"}
              className="text-brand-yellow font-medium hover:underline"
            >
              Entrar
            </Link>
          </p>

          <p className="mt-3 text-xs text-white/50">
            Você será o titular da empresa cadastrada e poderá convidar sua equipe por e-mail.
          </p>

          <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit} onChange={handleFormChange}>
            <AuthTextField
              id="name"
              name="name"
              label="Nome Completo"
              placeholder="Seu nome completo"
              autoComplete="name"
              defaultValue={draft.name}
              error={fieldErrors.name}
              required
            />

            {googleEmail ? (
              <>
                <AuthTextField
                  id="email"
                  name="googleEmail"
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={googleEmail}
                  disabled
                  error={fieldErrors.email}
                  required
                />
                <input type="hidden" name="email" value={googleEmail} />
              </>
            ) : (
              <AuthTextField
                id="email"
                name="email"
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                defaultValue={draft.email}
                error={fieldErrors.email}
                required
              />
            )}

            <AuthTextField
              id="phone"
              name="phone"
              label="Telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              defaultValue={draft.phone}
              error={fieldErrors.phone}
              required
            />

            <AuthTextField
              id="cpf"
              name="cpf"
              label="CPF"
              inputMode="numeric"
              placeholder="123.456.789-00"
              autoComplete="off"
              maxLength={14}
              onChange={handleCpfChange}
              defaultValue={draft.cpf}
              error={fieldErrors.cpf}
              required
            />

            <AuthTextField
              id="cnpj"
              name="cnpj"
              label="CNPJ da empresa"
              placeholder="00.000.000/0000-00"
              autoComplete="off"
              maxLength={18}
              defaultValue={draft.cnpj}
              onChange={(event) => {
                event.currentTarget.value = formatCnpj(event.currentTarget.value);
              }}
              error={fieldErrors.cnpj}
              required
            />

            <AuthTextField
              id="birthDate"
              name="birthDate"
              label="Data de nascimento"
              type="date"
              placeholder="AAAA-MM-DD"
              defaultValue={draft.birthDate}
              error={fieldErrors.birthDate}
              max={getMaximumAdultBirthDate()}
              required
            />

            {Object.keys(fieldErrors).length > 0 ? (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-300" role="alert">
                <p>Revise os campos destacados para continuar.</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {cadastroStep1Fields.map((field) =>
                    fieldErrors[field] ? (
                      <li key={field}>
                        <a className="underline" href={`#${field}`}>
                          {fieldErrors[field]}
                        </a>
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
            ) : null}

            <div className="pt-2">
              <AuthSubmitButton icon={<ArrowRightIcon className="w-5 h-5" />}>
                Próximo
              </AuthSubmitButton>
            </div>
          </form>

          <AuthSocialDivider label="ou continue com" />

          <AuthSocialButton
            label="Criar conta com Google"
            iconAlt="Google"
            iconSrc="/images/auth/google-icon.svg"
            provider="google"
            callbackUrl={callbackUrl ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 6L5 9L10 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleAccountFeedbackToast({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <aside
      aria-live="polite"
      className="fixed right-4 top-24 z-70 w-[min(24rem,calc(100vw-2rem))] md:right-8 md:top-28"
      role="status"
    >
      <div className="relative overflow-hidden rounded-2xl border border-brand-yellow/70 bg-brand-dark p-4 shadow-[0_14px_35px_rgba(35,31,32,0.36)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-yellow" />
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-xs font-black text-brand-dark">
            i
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.55px] text-brand-yellow">
              Conta Google
            </p>
            <p className="mt-1 text-sm leading-5 text-white/90">
              Ainda não encontramos uma conta aprovada para este e-mail Google. Preencha o cadastro
              para enviar sua candidatura.
            </p>
          </div>
          <ToastCloseButton onClose={onClose} />
        </div>
      </div>
    </aside>
  );
}

function CadastroPageFallback() {
  return (
    <main className="min-h-screen bg-brand-dark">
      <LogoSpinnerLoader className="min-h-[70vh]" label="Carregando" message="Preparando seu cadastro." />
    </main>
  );
}

/**
 * O boundary de Suspense é obrigatório, não decorativo: esta página chama `useSearchParams()` e,
 * sem ele, o `next build` falha no prerender com `missing-suspense-with-csr-bailout`. O
 * `app/loading.tsx` da raiz cobria isso por acidente; ele saiu para não brigar com o
 * `NavigationLoader`, então o boundary passa a ficar onde a exigência realmente está.
 */
export default function CadastroPage() {
  return (
    <Suspense fallback={<CadastroPageFallback />}>
      <CadastroPageContent />
    </Suspense>
  );
}
