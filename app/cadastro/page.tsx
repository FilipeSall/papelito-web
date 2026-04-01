"use client";

import Image from "next/image";
import Link from "next/link";

const benefits = [
  "Descontos exclusivos para membros",
  "Frete grátis nas primeiras compras",
  "Acesso antecipado a novidades",
  "Programa de pontos e recompensas",
];

export default function CadastroPage() {
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
            SEJA NOSSO CLIENTE
          </h1>
          <p className="mt-2 text-lg text-brand-dark/70 leading-7">
            Junte-se a mais de 100 mil Pontos de Venda
          </p>

          {/* Lista de benefícios */}
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

      {/* Seção Formulário - Lado Direito */}
      <div className="w-full lg:w-1/2 bg-brand-dark flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Step Indicator */}
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

          {/* Header */}
          <h2 className="text-3xl font-black text-white uppercase tracking-wide">
            Criar Conta
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Já tem uma conta?{" "}
            <Link
              href="/entrar"
              className="text-brand-yellow font-medium hover:underline"
            >
              Entrar
            </Link>
          </p>

          {/* Formulário */}
          <form className="mt-10 space-y-5">
            {/* Campo Nome Completo */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="text-xs font-medium text-white/70 uppercase tracking-widest"
              >
                Nome Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome completo"
                autoComplete="name"
                className="w-full h-12 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition"
              />
            </div>

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

            {/* Campo Telefone */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="phone"
                className="text-xs font-medium text-white/70 uppercase tracking-widest"
              >
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                className="w-full h-12 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition"
              />
            </div>

            {/* Botão Próximo */}
            <Link
              href="/cadastro/etapa-2"
              className="w-full h-14 bg-brand-yellow rounded-full flex items-center justify-center gap-2 text-brand-dark font-black uppercase tracking-wide hover:bg-brand-yellow/90 transition mt-6"
            >
              Próximo
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
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
