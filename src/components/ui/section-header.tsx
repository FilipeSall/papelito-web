import Link from "next/link";

interface SectionHeaderProps {
  /**
   * Emoji exibido ao lado do rótulo superior.
   * @example "🔥"
   */
  emoji: string;
  /**
   * Texto do rótulo superior em uppercase.
   * @example "Mais Vendidos"
   */
  label: string;
  /**
   * Título principal da seção (pode conter quebra de linha).
   * @example "NOSSOS\nPRODUTOS"
   */
  title: string;
  /**
   * URL do botão "Ver todos". Se omitido, o botão não é renderizado.
   */
  href?: string;
  /**
   * Texto do botão de ação.
   * @default "Ver todos"
   */
  linkText?: string;
}

/**
 * Ícone de seta para a direita usado no botão de ação.
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
 * Cabeçalho de seção reutilizável com emoji, rótulo, título e link opcional.
 *
 * Utilizado em seções como "Mais Vendidos", "Novidades", "Promoções" etc.
 * O título suporta múltiplas linhas quando separado por `\n`.
 *
 * @example
 * ```tsx
 * <SectionHeader
 *   emoji="🔥"
 *   label="Mais Vendidos"
 *   title="NOSSOS\nPRODUTOS"
 *   href="/produtos"
 * />
 * ```
 */
export function SectionHeader({
  emoji,
  label,
  title,
  href,
  linkText = "Ver todos",
}: SectionHeaderProps) {
  const titleLines = title.split("\n");

  return (
    <div className="flex items-end justify-between">
      {/* Left: Emoji + Label + Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 h-8">
          <span className="text-2xl leading-8">{emoji}</span>
          <span className="font-black text-xs leading-4 tracking-[1.2px] uppercase text-brand-dark">
            {label}
          </span>
        </div>
        <h2 className="font-black text-4xl leading-9 tracking-[0.369141px] uppercase text-brand-dark">
          {titleLines.map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </h2>
      </div>

      {/* Right: Link button */}
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 bg-brand-dark text-white px-6 py-3 rounded-full hover:opacity-80 transition-opacity"
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
