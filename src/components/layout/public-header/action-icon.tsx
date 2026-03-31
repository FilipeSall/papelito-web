import Image from "next/image";
import Link from "next/link";

type PublicHeaderActionIconProps = {
  href: string;
  label: string;
  src: string;
  iconClass: string;
  buttonClass: string;
  invertColors?: boolean;
};

/**
 * Botão de ação com ícone SVG no cabeçalho (busca, carrinho, perfil).
 * `invertColors` aplica filtro CSS para tornar o ícone branco — usado na versão mobile.
 */
export function PublicHeaderActionIcon({
  href,
  label,
  src,
  iconClass,
  buttonClass,
  invertColors = false,
}: PublicHeaderActionIconProps) {
  return (
    <Link aria-label={label} className={buttonClass} href={href}>
      <Image
        alt=""
        aria-hidden
        className={`order-0 flex-none grow-0 ${invertColors ? "filter-[brightness(0)_invert(1)]" : ""} ${iconClass}`}
        height={28}
        src={src}
        width={28}
      />
    </Link>
  );
}
