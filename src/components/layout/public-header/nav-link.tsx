"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type PublicHeaderNavLinkProps = {
  href: string;
  label: string;
  widthClass?: string;
};

/**
 * Link de navegação individual do cabeçalho desktop.
 * Aceita uma `widthClass` para controlar a largura fixa de cada item de menu.
 */
export function PublicHeaderNavLink({ href, label, widthClass = "" }: PublicHeaderNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      className={`order-0 relative inline-flex flex-none grow-0 items-center pb-0.5 text-sm font-medium leading-5 tracking-[-0.150391px] text-brand-dark transition hover:opacity-70 ${widthClass}`}
      href={href}
    >
      {label}
      {isActive && (
        <span
          aria-hidden
          className="animate-underline-slide absolute bottom-0 left-0 h-0.5 w-full origin-left bg-brand-dark"
        />
      )}
    </Link>
  );
}
