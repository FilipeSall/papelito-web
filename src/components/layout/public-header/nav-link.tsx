"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MenuUnderline } from "@/components/ui/menu-underline";
import { useIsMounted } from "@/hooks/use-is-mounted";

type PublicHeaderNavLinkProps = {
  href: string;
  label: string;
  widthClass?: string;
};

export function PublicHeaderNavLink({ href, label, widthClass = "" }: Readonly<PublicHeaderNavLinkProps>) {
  const pathname = usePathname();
  const isMounted = useIsMounted();
  // O estado ativo é resolvido só no cliente: em rota ISR ele ficaria congelado no HTML
  // em cache (o prerender da "/" na Vercel não vê pathname "/") e o React não corrige
  // divergência de atributo na hidratação.
  const isActive = isMounted && pathname === href;

  return (
    <Link
      className={`group order-0 relative inline-flex flex-none grow-0 items-center pb-0.5 text-sm font-medium leading-5 tracking-[-0.150391px] text-brand-dark ${widthClass}`}
      data-active={isActive}
      href={href}
    >
      {label}
      <MenuUnderline />
    </Link>
  );
}
