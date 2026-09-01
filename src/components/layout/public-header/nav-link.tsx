"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MenuUnderline } from "@/components/ui/menu-underline";
import { useIsMounted } from "@/hooks/use-is-mounted";

type PublicHeaderNavLinkProps = {
  href: string;
  label: string;
};

/**
 * Link da navegação pública.
 * O traço amarelo é desenhado com rough.js e riscado no hover, fixo no item ativo.
 * A faixa é rasa de propósito: com bowing alto o traço sobe e cobre o texto.
 */
export function PublicHeaderNavLink({ href, label }: Readonly<PublicHeaderNavLinkProps>) {
  const pathname = usePathname();
  const isMounted = useIsMounted();
  // O estado ativo é resolvido só no cliente: em rota ISR ele ficaria congelado no HTML
  // em cache (o prerender da "/" na Vercel não vê pathname "/") e o React não corrige
  // divergência de atributo na hidratação.
  const isActive = isMounted && pathname === href;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className="group relative inline-flex items-center pb-1 text-xs font-black uppercase leading-4 tracking-[0.18em] text-white transition-colors hover:text-brand-yellow data-[active=true]:text-brand-yellow"
      data-active={isActive}
      href={href}
    >
      {label}
      <MenuUnderline
        className="text-brand-yellow z-[-1] h-1.5"
        options={{ roughness: 1.5, bowing: 2, strokeWidth: 1.8, seed: 23 }}
        strokeWidth={1.8}
      />
    </Link>
  );
}
