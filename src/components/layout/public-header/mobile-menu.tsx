"use client";

import Link from "next/link";
import { useAuthSession } from "@/hooks/use-auth-session";

type MobilePublicLink = {
  href: string;
  label: string;
};

type PublicHeaderMobileMenuProps = {
  iconButtonClass: string;
  links: MobilePublicLink[];
};

/**
 * Menu hamburguer do cabeçalho mobile.
 * Usa `<details>/<summary>` nativo com animação CSS para abrir/fechar o dropdown de navegação.
 */
export function PublicHeaderMobileMenu({ iconButtonClass, links }: PublicHeaderMobileMenuProps) {
  const mobileMenuId = "public-mobile-menu";
  const { isAdministrator, isAuthenticated, isSeller } = useAuthSession();
  const authLinks = isAuthenticated
    ? [
        {
          href: isAdministrator ? "/admin/sales" : isSeller ? "/vendor/dashboard" : "/perfil",
          label: isAdministrator ? "Admin" : isSeller ? "Painel vendor" : "Perfil",
        },
      ]
    : [
        { href: "/entrar", label: "Entrar" },
        { href: "/cadastro", label: "Cadastrar" },
      ];
  const menuLinks = [...authLinks, ...links];

  return (
    <details className="relative [&>summary::before]:pointer-events-auto [&>summary::before]:fixed [&>summary::before]:inset-0 [&>summary::before]:z-20 [&>summary::before]:hidden [&>summary::before]:bg-transparent [&>summary::before]:content-[''] [&>nav]:pointer-events-none [&>nav]:invisible [&>nav]:-translate-y-2 [&>nav]:opacity-0 [&>nav]:transition-all [&>nav]:duration-200 [&>nav]:ease-out [&[open]>summary::before]:block [&[open]>nav]:pointer-events-auto [&[open]>nav]:visible [&[open]>nav]:translate-y-0 [&[open]>nav]:opacity-100">
      <summary
        aria-controls={mobileMenuId}
        aria-label="Abrir menu"
        className={`${iconButtonClass} relative z-30 cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        <svg
          aria-hidden
          className="order-0 h-6 w-6 flex-none grow-0 self-stretch"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 7H20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          <path d="M4 12H20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          <path d="M4 17H20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </summary>

      <nav
        aria-label="Navegação pública mobile"
        className="absolute right-0 top-[calc(100%+10px)] z-30 flex w-48 origin-top-right flex-col gap-4 border-2 border-brand-dark bg-brand-yellow px-4 py-4 shadow-[6px_6px_0_#231f20]"
        id={mobileMenuId}
      >
        {menuLinks.map((item, index) => (
          <Link
            className={`flex items-center gap-2 text-xs font-black uppercase leading-4 tracking-[0.18em] text-brand-dark transition-opacity hover:opacity-60 ${
              index === authLinks.length - 1 ? "border-b-2 border-brand-dark pb-4" : ""
            }`}
            href={item.href}
            key={item.label}
          >
            <span aria-hidden className="inline-block size-1.5 rotate-45 bg-brand-dark" />
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
