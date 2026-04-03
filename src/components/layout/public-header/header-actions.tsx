"use client";

import Image from "next/image";
import Link from "next/link";

import { useAuthSession } from "@/hooks/use-auth-session";

const iconButtonClass =
  "order-0 flex h-7 w-7 flex-none grow-0 items-center justify-center transition hover:opacity-70";

/** Logado: ícone carrinho + "Sair" link + pill "Perfil" com ícone */
function LoggedInActions({ invertColors = false }: { invertColors?: boolean }) {
  return (
    <div className="flex h-9 items-center gap-2">
      <Link aria-label="Carrinho" className={`${iconButtonClass} pt-1`} href="/carrinho">
        <Image
          alt=""
          aria-hidden
          className={`h-7 w-7 flex-none grow-0 ${invertColors ? "brightness-0 invert" : ""}`}
          height={28}
          src="/images/icons/cart.svg"
          width={28}
        />
      </Link>

      <Link
        className="inline-flex h-9 items-center gap-2 rounded-full bg-black px-4 text-sm font-medium leading-5 tracking-[-0.150391px] text-brand-yellow transition hover:opacity-90"
        href="/perfil"
      >
        <svg aria-hidden fill="none" height={24} viewBox="0 0 28 28" width={24} xmlns="http://www.w3.org/2000/svg">
          <path d="M19.8332 21.5V19.8333C19.8332 18.9493 19.482 18.1014 18.8569 17.4763C18.2317 16.8512 17.3839 16.5 16.4998 16.5H11.4998C10.6158 16.5 9.76794 16.8512 9.14281 17.4763C8.51769 18.1014 8.1665 18.9493 8.1665 19.8333V21.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M13.9998 13.1667C15.8408 13.1667 17.3332 11.6743 17.3332 9.83333C17.3332 7.99238 15.8408 6.5 13.9998 6.5C12.1589 6.5 10.6665 7.99238 10.6665 9.83333C10.6665 11.6743 12.1589 13.1667 13.9998 13.1667Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </svg>
        Perfil
      </Link>
    </div>
  );
}

/** Deslogado: "Entrar" link + pill "Cadastrar" */
function AuthButtons() {
  return (
    <div className="flex h-9 w-[152.36px] items-center gap-2">
      <Link
        className="order-0 inline-flex h-5 w-[40.28px] flex-none grow-0 items-center text-sm font-medium leading-5 tracking-[-0.150391px] text-black transition hover:opacity-70"
        href="/entrar"
      >
        Entrar
      </Link>
      <Link
        className="order-1 inline-flex h-9 w-[104.08px] flex-none grow items-center rounded-full bg-black px-4 text-sm font-black leading-5 tracking-[-0.150391px] text-brand-yellow transition hover:opacity-90"
        href="/cadastro"
      >
        Cadastrar
      </Link>
    </div>
  );
}

/** Seção de ações do cabeçalho desktop — alterna entre botões de auth e ações de usuário logado */
export function PublicHeaderDesktopActions() {
  const { isAuthenticated, isLoading } = useAuthSession();

  if (isLoading) {
    return <div className="h-9 w-[152.36px]" />;
  }

  return isAuthenticated ? <LoggedInActions /> : <AuthButtons />;
}

/** Seção de ações do cabeçalho mobile — mostra ações apenas quando logado */
export function PublicHeaderMobileActions({ invertColors = false }: { invertColors?: boolean }) {
  const { isAuthenticated, isLoading } = useAuthSession();

  if (isLoading || !isAuthenticated) return null;

  return <LoggedInActions invertColors={invertColors} />;
}
