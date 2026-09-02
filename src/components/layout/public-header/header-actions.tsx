"use client";

import Image from "next/image";
import Link from "next/link";

import { SellerPurchaseGuard } from "@/components/layout/seller-purchase-guard";
import { NotificationBell } from "@/components/layout/site-header";
import { useCartSummary } from "@/features/cart";
import { useAuthSession } from "@/hooks/use-auth-session";

const iconButtonClass =
  "order-0 flex h-7 w-7 flex-none grow-0 items-center justify-center transition hover:opacity-70";

const profileButtonBaseClass =
  "group inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border-2 px-2.5 pr-4 text-xs font-black uppercase leading-4 tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/80 focus-visible:ring-offset-2 active:translate-y-px";

const profileButtonDesktopClass =
  "border-brand-dark bg-brand-dark text-brand-yellow hover:border-brand-dark/85 hover:bg-brand-dark/85 focus-visible:ring-offset-brand-yellow";

const profileButtonMobileClass =
  "border-brand-yellow bg-brand-dark text-brand-yellow hover:border-brand-yellow hover:bg-brand-dark/85 focus-visible:ring-offset-brand-dark";

/** Logado: ícone carrinho + "Sair" link + pill "Perfil" com ícone */
function LoggedInActions({
  invertColors = false,
  isAdministrator = false,
  compactProfile = false,
}: {
  invertColors?: boolean;
  isAdministrator?: boolean;
  compactProfile?: boolean;
}) {
  const { totalItems } = useCartSummary();
  const { isSeller } = useAuthSession();
  const cartBadgeClass = invertColors
    ? "bg-brand-yellow text-brand-dark"
    : "bg-brand-dark text-brand-yellow";
  const profileHref = isAdministrator ? "/admin/sales" : isSeller ? "/vendor/dashboard" : "/perfil";
  const profileLabel = isAdministrator ? "Admin" : isSeller ? "Painel vendor" : "Perfil";
  const profileButtonClass = compactProfile
    ? "group inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border-2 border-brand-yellow bg-brand-dark text-brand-yellow transition-colors hover:bg-brand-dark/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark active:translate-y-px"
    : `${profileButtonBaseClass} ${invertColors ? profileButtonMobileClass : profileButtonDesktopClass}`;

  return (
    <div className="flex h-9 items-center gap-2">
      <SellerPurchaseGuard />
      <NotificationBell inverted={invertColors} />

      <Link aria-label="Carrinho" className={`${iconButtonClass} relative`} href="/carrinho">
        <Image
          alt=""
          aria-hidden
          className={`h-7 w-7 flex-none grow-0 ${invertColors ? "brightness-0 invert" : ""}`}
          height={28}
          src="/images/icons/cart.svg"
          width={28}
        />
        {totalItems > 0 && (
          <span
            className={`absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black leading-none ${cartBadgeClass}`}
          >
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </Link>

      <Link
        aria-label={profileLabel}
        className={profileButtonClass}
        href={profileHref}
      >
        <span className="grid size-7 place-items-center">
          <svg aria-hidden fill="none" height={26} viewBox="0 0 28 28" width={26} xmlns="http://www.w3.org/2000/svg">
            <path d="M19.8332 21.5V19.8333C19.8332 18.9493 19.482 18.1014 18.8569 17.4763C18.2317 16.8512 17.3839 16.5 16.4998 16.5H11.4998C10.6158 16.5 9.76794 16.8512 9.14281 17.4763C8.51769 18.1014 8.1665 18.9493 8.1665 19.8333V21.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            <path d="M13.9998 13.1667C15.8408 13.1667 17.3332 11.6743 17.3332 9.83333C17.3332 7.99238 15.8408 6.5 13.9998 6.5C12.1589 6.5 10.6665 7.99238 10.6665 9.83333C10.6665 11.6743 12.1589 13.1667 13.9998 13.1667Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </span>
        {compactProfile ? null : <span>{profileLabel}</span>}
      </Link>
    </div>
  );
}

/** Deslogado: "Entrar" link + pill "Cadastrar" */
function AuthButtons() {
  return (
    <div className="flex h-9 items-center gap-4">
      <Link
        className="inline-flex items-center text-xs font-black uppercase leading-4 tracking-[0.18em] text-brand-dark transition-colors hover:text-brand-dark/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-yellow"
        href="/entrar"
      >
        Entrar
      </Link>
      <Link
        className="inline-flex h-9 cursor-pointer items-center rounded-md border-2 border-brand-dark bg-brand-dark px-5 text-xs font-black uppercase leading-4 tracking-[0.18em] text-brand-yellow transition-colors hover:border-brand-dark/85 hover:bg-brand-dark/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-yellow active:translate-y-px"
        href="/cadastro"
      >
        Cadastrar
      </Link>
    </div>
  );
}

/** Seção de ações do cabeçalho desktop — alterna entre botões de auth e ações de usuário logado */
export function PublicHeaderDesktopActions() {
  const { isAdministrator, isAuthenticated } = useAuthSession();

  return isAuthenticated ? <LoggedInActions isAdministrator={isAdministrator} /> : <AuthButtons />;
}

/** Seção de ações do cabeçalho mobile — mostra ações apenas quando logado */
export function PublicHeaderMobileActions({ invertColors = false }: { invertColors?: boolean }) {
  const { isAdministrator, isAuthenticated } = useAuthSession();

  if (!isAuthenticated) return null;

  return (
    <LoggedInActions
      compactProfile
      invertColors={invertColors}
      isAdministrator={isAdministrator}
    />
  );
}
