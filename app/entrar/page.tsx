"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Seção Logo - Lado Esquerdo */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-yellow items-center justify-center relative">
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
            SEJA BEM-VINDO
          </h1>
          <p className="mt-4 text-lg text-brand-dark/70 max-w-xs leading-7">
            Acesse sua conta e aproveite os melhores produtos do Brasil.
          </p>
        </div>
      </div>

      {/* Seção Formulário - Lado Direito */}
      <div className="w-full lg:w-1/2 bg-brand-dark flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <h2 className="text-3xl font-black text-white uppercase tracking-wide">
            Entrar
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Não tem uma conta?{" "}
            <Link
              href="/cadastro"
              className="text-brand-yellow font-medium hover:underline"
            >
              Cadastre-se
            </Link>
          </p>

          {/* Formulário */}
          <form className="mt-10 space-y-6">
            {/* Campo E-mail */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-xs font-medium text-white/70 uppercase tracking-widest"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full h-12 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition"
              />
            </div>

            {/* Campo Senha */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-xs font-medium text-white/70 uppercase tracking-widest"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-12 px-4 pr-12 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Esqueceu a senha */}
            <div className="flex justify-end">
              <Link
                href="/recuperar-senha"
                className="text-xs text-brand-yellow hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              className="w-full h-14 bg-brand-yellow rounded-full flex items-center justify-center gap-2 text-brand-dark font-black uppercase tracking-wide hover:bg-brand-yellow/90 transition"
            >
              Entrar
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">ou continue com</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Botão Google */}
          <button
            type="button"
            className="mt-6 w-full h-12 border border-white/20 rounded-full flex items-center justify-center gap-3 text-sm font-medium text-white hover:bg-white/5 transition"
          >
            <Image
              src="/images/auth/google-icon.svg"
              alt="Google"
              width={18}
              height={18}
            />
            Entrar com Google
          </button>
        </div>
      </div>
    </div>
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
