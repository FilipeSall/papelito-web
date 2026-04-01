import Link from "next/link";

type MobilePrivateLink = {
  href: string;
  label: string;
};

type PrivateHeaderMobileMenuProps = {
  iconButtonClass: string;
  links: MobilePrivateLink[];
};

/**
 * Menu hamburguer do cabeçalho privado mobile.
 * Usa `<details>/<summary>` nativo com animação CSS para abrir/fechar o dropdown de navegação.
 */
export function PrivateHeaderMobileMenu({ iconButtonClass, links }: PrivateHeaderMobileMenuProps) {
  const mobileMenuId = "private-mobile-menu";

  return (
    <details className="relative [&>summary::before]:pointer-events-auto [&>summary::before]:fixed [&>summary::before]:inset-0 [&>summary::before]:z-20 [&>summary::before]:hidden [&>summary::before]:bg-transparent [&>summary::before]:content-[''] [&>nav]:pointer-events-none [&>nav]:invisible [&>nav]:-translate-y-2 [&>nav]:opacity-0 [&>nav]:transition-all [&>nav]:duration-200 [&>nav]:ease-out [&[open]>summary::before]:block [&[open]>nav]:pointer-events-auto [&[open]>nav]:visible [&[open]>nav]:translate-y-0 [&[open]>nav]:opacity-100">
      <summary
        aria-controls={mobileMenuId}
        aria-label="Abrir menu"
        className={`${iconButtonClass} relative z-30 cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        <svg
          aria-hidden
          className="h-6 w-6 shrink-0 self-stretch"
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
        aria-label="Navegação privada mobile"
        className="absolute right-0 top-[calc(100%+8px)] z-30 flex w-40 origin-top-right flex-col gap-4 rounded-md border border-white/10 bg-brand-dark px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        id={mobileMenuId}
      >
        {links.map((item) => (
          <Link
            className="text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:opacity-70"
            href={item.href}
            key={item.label}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
