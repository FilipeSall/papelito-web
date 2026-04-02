import Link from "next/link";
import { PrivateHeaderLinkLoadingIndicator } from "./link-loading-indicator";

type PrivateHeaderNavLinkProps = {
  href: string;
  label: string;
  widthClass?: string;
};

/**
 * Link de navegação individual do cabeçalho privado desktop.
 * Aceita uma `widthClass` para controlar a largura fixa de cada item de menu.
 */
export function PrivateHeaderNavLink({ href, label, widthClass = "" }: PrivateHeaderNavLinkProps) {
  return (
    <Link
      className={`relative inline-flex h-5 shrink-0 items-center text-sm font-medium leading-5 tracking-[-0.15px] text-white transition hover:opacity-70 ${widthClass}`}
      href={href}
    >
      {label}
      <PrivateHeaderLinkLoadingIndicator className="absolute -right-3 top-1/2 -translate-y-1/2" />
    </Link>
  );
}
