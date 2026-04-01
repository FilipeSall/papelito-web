import Link from "next/link";

/**
 * Ícone de seta para direita.
 *
 * Componente atômico SVG para indicar navegação/ação.
 */
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.33}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3.33 8h9.34M8 3.33L12.67 8 8 12.67" />
    </svg>
  );
}

interface PartnerBannerCtaProps {
  /**
   * Texto exibido no botão de ação.
   */
  children: React.ReactNode;
  /**
   * URL de destino ao clicar no botão.
   */
  href: string;
}

/**
 * Botão CTA (Call to Action) para o banner de parceiros.
 *
 * Componente molecular que combina texto e ícone de seta em um
 * botão escuro arredondado com hover state.
 *
 * @example
 * ```tsx
 * <PartnerBannerCta href="/parceiros">
 *   Quero ser um parceiro
 * </PartnerBannerCta>
 * ```
 */
export function PartnerBannerCta({ children, href }: PartnerBannerCtaProps) {
  return (
    <Link
      href={href}
      className="inline-flex self-start items-center gap-4 bg-brand-dark text-white px-10 py-4 rounded-full hover:bg-brand-dark/90 transition-colors"
    >
      <span className="font-black text-base leading-6 tracking-[-0.3125px] uppercase">
        {children}
      </span>
      <ArrowRightIcon className="size-4" />
    </Link>
  );
}
