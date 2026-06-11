"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowRightIcon,
  AuthSocialButton,
  AuthSubmitButton,
} from "@/components/auth/atoms";
import { AuthSocialDivider, AuthTextField } from "@/components/auth/molecules";
import { formatCpf } from "@/features/revendedor/utils/revendedor-registration";

import { CADASTRO_STORAGE_KEY, type CadastroStep1Data } from "./shared";

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cpf = formatCpf(String(formData.get("cpf") ?? "")).trim();
    const payload: CadastroStep1Data = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      ...(cpf ? { cpf } : {}),
    };

    if (!payload.name || !payload.email || !payload.phone) return;

    window.sessionStorage.setItem(CADASTRO_STORAGE_KEY, JSON.stringify(payload));
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
          <Image
            src="/images/auth/logo-with-flag.svg"
            alt="Marketplace Papelito"
            width={304}
            height={182}
            className="mb-8"
            priority
          />
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

          <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
            <AuthTextField
              id="name"
              name="name"
              label="Nome Completo"
              placeholder="Seu nome completo"
              autoComplete="name"
              required
            />

            <AuthTextField
              id="email"
              name="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />

            <AuthTextField
              id="phone"
              name="phone"
              label="Telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              required
            />

            <AuthTextField
              id="cpf"
              name="cpf"
              label="CPF (opcional)"
              inputMode="numeric"
              placeholder="123.456.789-00"
              autoComplete="off"
            />

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
            callbackUrl={callbackUrl ?? "/produtos"}
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
