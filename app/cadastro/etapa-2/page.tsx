"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect, useRef, useState } from "react";

import {
  ArrowRightIcon,
  AuthSubmitButton,
} from "@/components/auth/atoms";
import { AuthPasswordField, AuthSelectField, AuthTextField } from "@/components/auth/molecules";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import { lookupCepDetailed } from "@/features/checkout/services/lookup-cep";
import {
  formatCep,
  isValidCep,
  isValidCnpj,
} from "@/lib/validation/brazilian-documents";

import {
  CADASTRO_STEP1_DRAFT_KEY,
  BRAZILIAN_STATES,
  CADASTRO_STEP1_ERROR_KEY,
  CADASTRO_STEP2_DRAFT_KEY,
  CADASTRO_STORAGE_KEY,
  type CadastroStep1Data,
  type CadastroStep1Errors,
  type CadastroStep2Draft,
} from "../shared";

const benefits = [
  "Descontos exclusivos para membros",
  "Frete grátis nas primeiras compras",
  "Acesso antecipado a novidades",
  "Programa de pontos e recompensas",
];

const EMPTY_STEP2_DRAFT: CadastroStep2Draft = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

function getFormDataString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function step1ErrorsFromApiErrors(errors: Record<string, string[]>): CadastroStep1Errors {
  const mappedFields = {
    full_name: "name",
    email: "email",
    phone: "phone",
    cpf: "cpf",
    birth_date: "birthDate",
    cnpj: "cnpj",
  } as const;

  return Object.entries(mappedFields).reduce<CadastroStep1Errors>((result, [apiField, field]) => {
    const message = errors[apiField]?.find(Boolean);
    if (message) result[field] = message;
    return result;
  }, {});
}

function readStep2Draft(): CadastroStep2Draft {
  if (typeof window === "undefined") return { ...EMPTY_STEP2_DRAFT };

  const saved = window.sessionStorage.getItem(CADASTRO_STEP2_DRAFT_KEY);
  if (!saved) return { ...EMPTY_STEP2_DRAFT };

  try {
    return { ...EMPTY_STEP2_DRAFT, ...(JSON.parse(saved) as Partial<CadastroStep2Draft>) };
  } catch {
    return { ...EMPTY_STEP2_DRAFT };
  }
}

function CadastroEtapa2PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step1, setStep1] = useState<CadastroStep1Data | null>(null);
  const [step2Draft] = useState<CadastroStep2Draft>(readStep2Draft);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState({
    street: step2Draft.street,
    neighborhood: step2Draft.neighborhood,
    city: step2Draft.city,
    state: step2Draft.state,
  });
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "error">("idle");
  const callbackUrl = searchParams.get("callbackUrl");
  const submittedRef = useRef(false);
  const valuesRef = useRef<CadastroStep2Draft>(step2Draft);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem(CADASTRO_STORAGE_KEY);
    if (!saved) {
      router.replace("/cadastro");
      return;
    }
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration from sessionStorage on mount
      setStep1(JSON.parse(saved) as CadastroStep1Data);
    } catch {
      router.replace("/cadastro");
    }
  }, [router]);

  useEffect(() => {
    function persistDraft() {
      if (submittedRef.current) return;

      const draft = valuesRef.current;
      const hasContent = Object.values(draft).some((value) => value !== "");
      if (!hasContent) {
        window.sessionStorage.removeItem(CADASTRO_STEP2_DRAFT_KEY);
        return;
      }

      window.sessionStorage.setItem(CADASTRO_STEP2_DRAFT_KEY, JSON.stringify(draft));
    }

    window.addEventListener("pagehide", persistDraft);
    return () => {
      window.removeEventListener("pagehide", persistDraft);
      persistDraft();
    };
  }, []);

  function handleFormChange(event: React.ChangeEvent<HTMLFormElement>) {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLSelectElement)
    ) {
      return;
    }

    if (!(target.name in EMPTY_STEP2_DRAFT)) return;
    valuesRef.current = {
      ...valuesRef.current,
      [target.name]: target.value,
    };
  }

  async function handleCepChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.currentTarget.value = formatCep(event.currentTarget.value);
    valuesRef.current.cep = event.currentTarget.value;
    const digits = event.currentTarget.value.replace(/\D/g, "");

    if (digits.length !== 8) {
      setCepStatus("idle");
      return;
    }

    setCepStatus("loading");
    const result = await lookupCepDetailed(digits);

    if (result.status !== "ok") {
      setCepStatus("error");
      return;
    }

    setCepStatus("idle");
    setAddress((current) => ({
      street: result.data.street || current.street,
      neighborhood: result.data.neighborhood || current.neighborhood,
      city: result.data.city || current.city,
      state: result.data.state || current.state,
    }));
    valuesRef.current = {
      ...valuesRef.current,
      street: result.data.street || valuesRef.current.street,
      neighborhood: result.data.neighborhood || valuesRef.current.neighborhood,
      city: result.data.city || valuesRef.current.city,
      state: result.data.state || valuesRef.current.state,
    };
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!step1) return;

    const formData = new FormData(event.currentTarget);
    const password = getFormDataString(formData, "password");
    const confirmPassword = getFormDataString(formData, "confirmPassword");
    const cep = getFormDataString(formData, "cep").trim();
    const cnpj = step1.cnpj.trim();
    const street = getFormDataString(formData, "street").trim();
    const number = getFormDataString(formData, "number").trim();
    const complement = getFormDataString(formData, "complement").trim();
    const neighborhood = getFormDataString(formData, "neighborhood").trim();
    const city = getFormDataString(formData, "city").trim();
    const state = getFormDataString(formData, "state").trim().toUpperCase();

    valuesRef.current = {
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
    };

    if (!isValidCnpj(cnpj)) {
      setErrorMessage("Informe um CNPJ válido.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    if (!isValidCep(cep)) {
      setErrorMessage("Informe um CEP válido.");
      return;
    }

    if (!street || !number || !neighborhood || !city || !state) {
      setErrorMessage(
        "Preencha logradouro, número, bairro, cidade e estado para salvar o endereço.",
      );
      return;
    }

    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/company-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: step1.email,
            password,
            full_name: step1.name,
            phone: step1.phone,
            cpf: step1.cpf,
            birth_date: step1.birthDate,
            cnpj,
            cep,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { code?: string; message?: string; data?: { errors?: Record<string, string[]> } }
            | null;

          if (response.status === 409) {
            setErrorMessage("Já existe uma candidatura em aberto para estes dados.");
          } else if (response.status === 422) {
            const errors = body?.data?.errors ?? {};
            const step1Errors = step1ErrorsFromApiErrors(errors);
            if (Object.keys(step1Errors).length > 0) {
              window.sessionStorage.setItem(CADASTRO_STEP1_ERROR_KEY, JSON.stringify(step1Errors));
              router.push(
                callbackUrl ? `/cadastro?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/cadastro",
              );
              return;
            }
            const message = Object.values(errors)
              .flat()
              .find(Boolean);
            setErrorMessage(message ?? "Verifique os dados informados.");
          } else {
            setErrorMessage(body?.message ?? "Não foi possível enviar sua candidatura. Tente novamente.");
          }
          setIsSubmitting(false);
          return;
        }

        window.sessionStorage.removeItem(CADASTRO_STORAGE_KEY);
        window.sessionStorage.removeItem(CADASTRO_STEP1_DRAFT_KEY);
        window.sessionStorage.removeItem(CADASTRO_STEP2_DRAFT_KEY);
        router.push("/cadastro/analise");
        router.refresh();
      } catch {
        setErrorMessage("Erro de rede. Tente novamente.");
        setIsSubmitting(false);
      }
    });
  }

  let cepHint = "Preenchemos o endereço automaticamente.";
  if (cepStatus === "loading") {
    cepHint = "Buscando endereço...";
  } else if (cepStatus === "error") {
    cepHint = "Não encontramos esse CEP. Preencha o endereço manualmente.";
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden items-center justify-center bg-brand-yellow lg:flex lg:h-screen lg:w-1/2 lg:sticky lg:top-0">
        <div className="flex flex-col items-center px-12 text-center">
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
          <h1 className="text-2xl font-semibold tracking-tight text-brand-dark">
            SEJA NOSSO CLIENTE
          </h1>
          <p className="mt-2 text-lg leading-7 text-brand-dark/70">
            Junte-se a mais de 100 mil Pontos de Venda
          </p>

          <ul className="mt-10 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark">
                  <CheckIcon className="h-3 w-3 text-brand-yellow" />
                </span>
                <span className="text-sm font-medium text-brand-dark">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow">
                <CheckIcon className="h-3.5 w-3.5 text-brand-dark" />
              </span>
              <div className="h-px w-6 bg-brand-yellow" />
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow text-xs font-black text-brand-dark">
              2
            </span>
            <span className="ml-2 text-xs text-white/40">Etapa 2 de 2</span>
          </div>

          <h2 className="text-3xl font-black uppercase tracking-wide text-white">
            Enviar candidatura
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Já tem uma conta?{" "}
            <Link
              href={callbackUrl ? `/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/entrar"}
              className="font-medium text-brand-yellow hover:underline"
            >
              Entrar
            </Link>
          </p>

          <form className="mt-10 space-y-5" onChange={handleFormChange} onSubmit={handleSubmit}>
            <fieldset className="space-y-5" disabled={isSubmitting}>
              <AuthTextField
                id="cep"
                name="cep"
                label="CEP"
                placeholder="01.310-000"
                inputMode="numeric"
                autoComplete="postal-code"
                defaultValue={step2Draft.cep}
                maxLength={9}
                onChange={(event) => {
                  void handleCepChange(event);
                }}
                hint={cepHint}
                required
              />

              <AuthTextField
                id="street"
                name="street"
                label="Logradouro"
                placeholder="Avenida Paulista"
                autoComplete="address-line1"
                value={address.street}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setAddress((current) => ({ ...current, street: nextValue }));
                }}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <AuthTextField
                  id="number"
                  name="number"
                  label="Número"
                  placeholder="1000"
                  autoComplete="address-line2"
                  defaultValue={step2Draft.number}
                  required
                />
                <AuthTextField
                  id="complement"
                  name="complement"
                  label="Complemento"
                  placeholder="Sala 2 (opcional)"
                  autoComplete="address-line3"
                  defaultValue={step2Draft.complement}
                />
              </div>

              <AuthTextField
                id="neighborhood"
                name="neighborhood"
                label="Bairro"
                placeholder="Bela Vista"
                value={address.neighborhood}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setAddress((current) => ({ ...current, neighborhood: nextValue }));
                }}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <AuthTextField
                  id="city"
                  name="city"
                  label="Cidade"
                  placeholder="São Paulo"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setAddress((current) => ({ ...current, city: nextValue }));
                  }}
                  required
                />
                <AuthSelectField
                  id="state"
                  name="state"
                  label="Estado"
                  value={address.state}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setAddress((current) => ({ ...current, state: nextValue }));
                  }}
                  required
                >
                  <option value="">UF</option>
                  {BRAZILIAN_STATES.map((uf) => (
                    <option key={uf.value} value={uf.value}>
                      {uf.value}
                    </option>
                  ))}
                </AuthSelectField>
              </div>

              <AuthPasswordField
                id="password"
                name="password"
                label="Senha"
                placeholder="Crie uma senha forte (mín. 8)"
                autoComplete="new-password"
                required
                minLength={8}
              />

              <AuthPasswordField
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar Senha"
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
              />

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAcceptTerms(!acceptTerms)}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition ${
                    acceptTerms
                      ? "border-brand-yellow bg-brand-yellow"
                      : "border-white/30 bg-transparent"
                  }`}
                  aria-label="Aceitar termos"
                  aria-pressed={acceptTerms}
                >
                  {acceptTerms ? <CheckIcon className="h-2.5 w-2.5 text-brand-dark" /> : null}
                </button>
                <p className="text-xs font-medium leading-relaxed text-white/60">
                  Confirmo que tenho 18 anos ou mais e concordo com a{" "}
                  <Link
                    href="/privacidade"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-yellow hover:underline"
                  >
                  Política de Privacidade
                  </Link>
                  .
                </p>
              </div>

              {errorMessage ? (
                <p className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-300" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <Link
                  href="/cadastro"
                  className="flex h-14 items-center justify-center rounded-full border border-white/20 px-8 font-black uppercase leading-none tracking-wide text-white transition hover:bg-white/5"
                >
                  Voltar
                </Link>
                <div className="sm:flex-1">
                  <AuthSubmitButton
                    icon={!isSubmitting ? <ArrowRightIcon className="h-4 w-4" /> : undefined}
                    disabled={!acceptTerms || isSubmitting || !step1}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar candidatura"}
                  </AuthSubmitButton>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
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

function CadastroEtapa2PageFallback() {
  return (
    <main className="min-h-screen bg-brand-dark">
      <LogoSpinnerLoader className="min-h-[70vh]" label="Carregando" message="Preparando seus dados." />
    </main>
  );
}

/**
 * O boundary de Suspense é obrigatório, não decorativo: esta página chama `useSearchParams()` e,
 * sem ele, o `next build` falha no prerender com `missing-suspense-with-csr-bailout`. O
 * `app/loading.tsx` da raiz cobria isso por acidente; ele saiu para não brigar com o
 * `NavigationLoader`, então o boundary passa a ficar onde a exigência realmente está.
 */
export default function CadastroEtapa2Page() {
  return (
    <Suspense fallback={<CadastroEtapa2PageFallback />}>
      <CadastroEtapa2PageContent />
    </Suspense>
  );
}
