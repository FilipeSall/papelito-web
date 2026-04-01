import Image from "next/image";
import Link from "next/link";

type PrivateHeaderActionIconProps = {
  href: string;
  label: string;
  src: string;
  iconClass: string;
  buttonClass: string;
};

/**
 * Botão de ação com ícone SVG no cabeçalho privado (busca, perfil).
 * Os ícones são renderizados em branco para contraste com o fundo escuro.
 */
export function PrivateHeaderActionIcon({
  href,
  label,
  src,
  iconClass,
  buttonClass,
}: PrivateHeaderActionIconProps) {
  return (
    <Link aria-label={label} className={buttonClass} href={href}>
      <Image
        alt=""
        aria-hidden
        className={`shrink-0 brightness-0 invert ${iconClass}`}
        height={20}
        src={src}
        width={20}
      />
    </Link>
  );
}
