import Image from "next/image";
import Link from "next/link";

import { CheckIcon } from "./check-icon";

const BENEFITS = [
  "Descontos exclusivos para membros",
  "Frete grátis nas primeiras compras",
  "Acesso antecipado a novidades",
  "Programa de pontos e recompensas",
];

export function CadastroAnaliseAside() {
  return (
    <aside className="relative hidden items-center justify-center bg-brand-yellow lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-1/2">
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
        <h1 className="text-2xl font-semibold tracking-tight text-brand-dark">SEJA NOSSO CLIENTE</h1>
        <p className="mt-2 text-lg leading-7 text-brand-dark/70">
          Junte-se a mais de 100 mil Pontos de Venda
        </p>
        <ul className="mt-10 space-y-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark">
                <CheckIcon className="h-3 w-3 text-brand-yellow" />
              </span>
              <span className="text-sm font-medium text-brand-dark">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
