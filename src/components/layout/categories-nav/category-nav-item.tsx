import Link from "next/link";

interface CategoryNavItemProps {
  title: string;
  subtitle: string;
  href: string;
  /** Inclinação em graus: cada chip é recortado torto, como no site da marca. */
  tilt?: number;
  className?: string;
}

/**
 * Chip de coleção, no recorte que a marca usa nos seletores do site institucional:
 * retângulo de borda preta levemente torto, preenchido de preto quando acionado.
 */
export function CategoryNavItem({
  title,
  subtitle,
  href,
  tilt = 0,
  className,
}: CategoryNavItemProps) {
  return (
    <Link
      className={`group inline-flex min-w-0 flex-col items-center gap-1 border-2 border-brand-dark bg-transparent px-5 py-3 text-center transition-colors hover:bg-brand-dark focus-visible:bg-brand-dark sm:px-7 sm:py-4 ${className ?? ""}`}
      href={href}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span className="text-sm font-black uppercase leading-none tracking-[0.06em] text-brand-dark transition-colors group-hover:text-brand-yellow group-focus-visible:text-brand-yellow sm:text-base">
        {title}
      </span>
      <span
        className="text-[0.625rem] font-black uppercase leading-4 tracking-[0.14em] text-text-secondary transition-colors group-hover:text-brand-yellow/80 group-focus-visible:text-brand-yellow/80"
        data-numeric
      >
        {subtitle}
      </span>
    </Link>
  );
}
