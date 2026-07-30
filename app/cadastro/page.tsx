"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  ArrowRightIcon,
  AuthSocialButton,
  AuthSubmitButton,
} from "@/components/auth/atoms";
import { AuthSocialDivider, AuthTextField } from "@/components/auth/molecules";
import { formatCpf } from "@/features/revendedor/utils/revendedor-registration";
import { formatCnpj, isValidCnpj, isValidCpf } from "@/lib/validation/brazilian-documents";

import {
  CADASTRO_STEP1_DRAFT_KEY,
  CADASTRO_STORAGE_KEY,
  type CadastroIntent,
  type CadastroStep1Data,
  type CadastroStep1Draft,
} from "./shared";

const benefits = [
  "Descontos exclusivos para membros",
  "Frete grátis nas primeiras compras",
  "Acesso antecipado a novidades",
  "Programa de pontos e recompensas",
];

export default function CadastroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const intentRef = useRef(intent);

  useEffect(() => {
    intentRef.current = intent;
  }, [intent]);

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

  function handleCpfChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.currentTarget.value = formatCpf(event.currentTarget.value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(event.currentTarget);
    const cpf = formatCpf(String(formData.get("cpf") ?? "")).trim();
    const cnpj = formatCnpj(String(formData.get("cnpj") ?? "")).trim();
    const payload: CadastroStep1Data = {
      birthDate: String(formData.get("birthDate") ?? ""),
      cnpj,
      cpf,
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      intent,
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.birthDate) {
      setErrorMessage("Preencha todos os campos para continuar.");
      return;
    }

    if (!isValidCpf(cpf)) {
      setErrorMessage("Informe um CPF válido.");
      return;
    }

    if (!isValidCnpj(cnpj)) {
      setErrorMessage("Informe um CNPJ válido.");
      return;
    }

    submittedRef.current = true;
    window.sessionStorage.setItem(CADASTRO_STORAGE_KEY, JSON.stringify(payload));
    window.sessionStorage.removeItem(CADASTRO_STEP1_DRAFT_KEY);
    router.push(
      callbackUrl
        ? `/cadastro/etapa-2?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/cadastro/etapa-2",
    );
  }

  return (
    <div className="flex min-h-screen">
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

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} onChange={handleFormChange}>
            <AuthTextField
              id="name"
              name="name"
              label="Nome Completo"
              placeholder="Seu nome completo"
              autoComplete="name"
              defaultValue={draft.name}
              required
            />

            <AuthTextField
              id="email"
              name="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              defaultValue={draft.email}
              required
            />

            <AuthTextField
              id="phone"
              name="phone"
              label="Telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              defaultValue={draft.phone}
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
              required
            />

            <AuthTextField
              id="birthDate"
              name="birthDate"
              label="Data de nascimento"
              type="date"
              placeholder="AAAA-MM-DD"
              defaultValue={draft.birthDate}
              required
            />

            {errorMessage ? (
              <p className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-300" role="alert">
                {errorMessage}
              </p>
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

function CheckIcon({ className }: { className?: string }) {
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
