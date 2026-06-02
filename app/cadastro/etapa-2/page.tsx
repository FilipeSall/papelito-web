"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { startTransition, useEffect, useState } from "react";

import {
  ArrowRightIcon,
  AuthSubmitButton,
} from "@/components/auth/atoms";
import { AuthPasswordField, AuthTextField } from "@/components/auth/molecules";

import { CADASTRO_STORAGE_KEY, type CadastroStep1Data } from "../shared";

const benefits = [
  "Descontos exclusivos para membros",
  "Frete grátis nas primeiras compras",
  "Acesso antecipado a novidades",
  "Programa de pontos e recompensas",
];

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export default function CadastroEtapa2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step1, setStep1] = useState<CadastroStep1Data | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/produtos";

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!step1) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const cep = String(formData.get("cep") ?? "").trim();

    if (password.length < 8) {
      setErrorMessage("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    if (!cep) {
      setErrorMessage("Informe o CEP para continuar.");
      return;
    }

    setIsSubmitting(true);

    const { first, last } = splitName(step1.name);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: step1.email,
            password,
            first_name: first,
            last_name: last,
            phone_number: step1.phone,
            cep,
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { code?: string; message?: string; data?: { errors?: Record<string, string[]> } }
            | null;

          if (response.status === 409) {
            setErrorMessage("Já existe uma conta com este e-mail.");
          } else if (response.status === 422) {
            const messages = Object.values(body?.data?.errors ?? {})
              .flat()
              .filter(Boolean);
            setErrorMessage(messages[0] ?? "Verifique os dados informados.");
          } else {
            setErrorMessage(body?.message ?? "Não foi possível criar a conta. Tente novamente.");
          }
          setIsSubmitting(false);
          return;
        }

        const signInResult = await signIn("credentials", {
          username: step1.email,
          password,
          redirect: false,
          callbackUrl,
        });

        if (signInResult?.error) {
          setErrorMessage("Conta criada, mas houve um erro ao entrar. Tente fazer login.");
          setIsSubmitting(false);
          return;
        }

        window.sessionStorage.removeItem(CADASTRO_STORAGE_KEY);
        router.push(signInResult?.url ?? callbackUrl);
        router.refresh();
      } catch {
        setErrorMessage("Erro de rede. Tente novamente.");
        setIsSubmitting(false);
      }
    });
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden items-center justify-center bg-brand-yellow lg:flex lg:h-screen lg:w-1/2 lg:sticky lg:top-0">
        <div className="flex flex-col items-center px-12 text-center">
          <Image
            src="/images/auth/logo-with-flag.svg"
            alt="Marketplace Papelito"
            width={304}
            height={182}
            className="mb-8"
            priority
          />
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
            Finalizar Cadastro
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

          <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
            <fieldset className="space-y-5" disabled={isSubmitting}>
              <AuthTextField
                id="cep"
                name="cep"
                label="CEP"
                placeholder="01.310-000"
                autoComplete="postal-code"
                required
              />

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
                  Confirmo que tenho 18 anos ou mais e concordo com os{" "}
                  <Link href="/termos" className="text-brand-yellow hover:underline">
                    Termos de Uso
                  </Link>{" "}
                  e{" "}
                  <Link href="/privacidade" className="text-brand-yellow hover:underline">
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

              <div className="flex gap-3 pt-2">
                <Link
                  href="/cadastro"
                  className="flex h-14 flex-1 items-center justify-center rounded-full border border-white/20 font-black uppercase tracking-wide text-white transition hover:bg-white/5"
                >
                  Voltar
                </Link>
                <div className="flex-1">
                  <AuthSubmitButton
                    icon={!isSubmitting ? <ArrowRightIcon className="h-4 w-4" /> : undefined}
                    disabled={!acceptTerms || isSubmitting || !step1}
                  >
                    {isSubmitting ? "Criando..." : "Criar Conta"}
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

function CheckIcon({ className }: { className?: string }) {
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
