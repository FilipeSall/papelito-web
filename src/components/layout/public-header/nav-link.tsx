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
          className="animate-underline-slide absolute bottom-0 left-0 h-1 w-full origin-left bg-brand-dark [clip-path:polygon(0_37.5%,100%_0,100%_100%,0_62.5%)]"
        />
      )}
    </Link>
  );
}
