import Link from "next/link";

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
  return (
    <Link
      className={`order-0 inline-flex h-5 flex-none grow-0 items-center leading-5 text-sm font-medium tracking-[-0.150391px] text-brand-dark transition hover:opacity-70 ${widthClass}`}
      href={href}
    >
      {label}
    </Link>
  );
}
