import Image from "next/image";
import Link from "next/link";

type PublicHeaderLogoProps = {
  variant: "mobile" | "desktop";
};

/**
 * Logo da Papelito no cabeçalho público.
 * Renderiza imagens e tamanhos diferentes conforme o contexto mobile ou desktop.
 */
export function PublicHeaderLogo({ variant }: PublicHeaderLogoProps) {
  if (variant === "mobile") {
    return (
      <Link aria-label="Ir para a home" href="/">
        <Image alt="Papelito" height={36} priority src="/images/logo2.svg" width={121} />
      </Link>
    );
  }

  return (
    <Link aria-label="Ir para a home" className="justify-self-start px-4" href="/">
      <Image alt="Papelito" height={73} priority src="/images/logo.svg" width={123} />
    </Link>
  );
}
