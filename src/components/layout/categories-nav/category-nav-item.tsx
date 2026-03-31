import Link from "next/link";

interface CategoryNavItemProps {
  emoji: string;
  title: string;
  subtitle: string;
  href: string;
}

/**
 * Card atômico de navegação por categoria.
 *
 * Renderiza um link com fundo escuro contendo emoji, título em negrito
 * e subtítulo em cinza. Utiliza posicionamento absoluto interno para
 * replicar fielmente o layout do design.
 */
export function CategoryNavItem({
  emoji,
  title,
  subtitle,
  href,
}: CategoryNavItemProps) {
  return (
    <Link
      href={href}
      className="relative w-[186px] h-29.75 shrink-0 bg-[#3A3A3A] rounded-2xl transition-colors hover:bg-[#444444]"
    >
      <span className="absolute text-2xl leading-8 tracking-[0.0703125px] top-[14px] left-[22px]">
        {emoji}
      </span>
      <span className="absolute font-black text-sm leading-5 tracking-[-0.150391px] text-white top-[46px] left-[22px]">
        {title}
      </span>
      <span className="absolute text-xs leading-4 text-[#99A1AF] top-[77px] left-[22px]">
        {subtitle}
      </span>
    </Link>
  );
}
