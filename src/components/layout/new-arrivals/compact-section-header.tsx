import Link from "next/link";

interface CompactSectionHeaderProps {
  /**
   * Emoji exibido no círculo amarelo.
   * @example "✨"
   */
  emoji: string;
  /**
   * Título da seção em uppercase.
   * @example "Recém Chegados"
   */
  title: string;
  /**
   * URL do link "Ver todos". Se omitido, o link não é renderizado.
   */
  href?: string;
  /**
   * Texto do link de ação.
   * @default "Ver todos"
   */
  linkText?: string;
}

/**
 * Ícone de seta para a direita usado no link.
 */
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Cabeçalho compacto de seção com badge de emoji e link opcional.
 *
 * Versão simplificada do SectionHeader, ideal para seções menores
 * como "Recém Chegados". Exibe emoji em círculo amarelo, título
 * em linha única e link "Ver todos" à direita.
 *
 * @example
 * ```tsx
 * <CompactSectionHeader
 *   emoji="✨"
 *   title="Recém Chegados"
 *   href="/novidades"
 * />
 * ```
 */
export function CompactSectionHeader({
  emoji,
  title,
  href,
  linkText = "Ver todos",
}: CompactSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 h-8">
      {/* Emoji badge */}
      <div className="flex items-center justify-center size-8 bg-brand-yellow rounded-full">
        <span className="text-sm">{emoji}</span>
      </div>

      {/* Title */}
      <h2 className="font-black text-2xl leading-8 tracking-[0.0703px] uppercase text-brand-dark">
        {title}
      </h2>

      {/* Link (optional) */}
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 ml-auto text-brand-dark hover:opacity-70 transition-opacity"
        >
          <span className="font-black text-sm leading-5 tracking-[-0.150391px] uppercase">
            {linkText}
          </span>
          <ArrowRightIcon className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
