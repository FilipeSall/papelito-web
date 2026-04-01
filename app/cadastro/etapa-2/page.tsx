"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const benefits = [
  "Descontos exclusivos para membros",
  "Frete grátis nas primeiras compras",
  "Acesso antecipado a novidades",
  "Programa de pontos e recompensas",
];

export default function CadastroEtapa2Page() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Seção Logo - Lado Esquerdo */}
      <div className="relative hidden items-center justify-center bg-brand-yellow lg:flex lg:w-1/2">
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

          {/* Lista de benefícios */}
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

      {/* Seção Formulário - Lado Direito */}
      <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Step Indicator */}
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

          {/* Header */}
          <h2 className="text-3xl font-black uppercase tracking-wide text-white">
            Finalizar Cadastro
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Já tem uma conta?{" "}
            <Link
              href="/entrar"
              className="font-medium text-brand-yellow hover:underline"
            >
              Entrar
            </Link>
          </p>

          {/* Formulário */}
          <form className="mt-10 space-y-5">
            {/* Campo Senha */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-widest text-white/70"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Crie uma senha forte"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 pr-12 text-sm text-white placeholder:text-white/30 transition focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-medium uppercase tracking-widest text-white/70"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 pr-12 text-sm text-white placeholder:text-white/30 transition focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                  aria-label={
                    showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Checkbox Termos */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setAcceptTerms(!acceptTerms)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                  acceptTerms
                    ? "border-brand-yellow bg-brand-yellow"
                    : "border-white/30 bg-transparent"
                }`}
                aria-label="Aceitar termos"
              >
                {acceptTerms && (
                  <CheckIcon className="h-2.5 w-2.5 text-brand-dark" />
                )}
              </button>
              <p className="text-xs font-medium leading-relaxed text-white/60">
                Confirmo que tenho 18 anos ou mais e concordo com os{" "}
                <Link
                  href="/termos"
                  className="text-brand-yellow hover:underline"
                >
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link
                  href="/privacidade"
                  className="text-brand-yellow hover:underline"
                >
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/cadastro"
                className="flex h-14 flex-1 items-center justify-center rounded-full border border-white/20 font-black uppercase tracking-wide text-white transition hover:bg-white/5"
              >
                Voltar
              </Link>
              <button
                type="submit"
                disabled={!acceptTerms}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-brand-yellow font-black uppercase tracking-wide text-brand-dark transition hover:bg-brand-yellow/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Criar Conta
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 3C4.5 3 1.5 5.5 0.5 8C1.5 10.5 4.5 13 8 13C11.5 13 14.5 10.5 15.5 8C14.5 5.5 11.5 3 8 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="8"
        cy="8"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 2L14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 6.5C6.18 6.82 6 7.39 6 8C6 9.1 6.9 10 8 10C8.61 10 9.18 9.82 9.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 5C1.8 6 1 7 0.5 8C1.5 10.5 4.5 13 8 13C9 13 10 12.8 10.8 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 3C11.5 3 14.5 5.5 15.5 8C15.2 8.7 14.8 9.3 14.3 9.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 10H16M16 10L11 5M16 10L11 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
