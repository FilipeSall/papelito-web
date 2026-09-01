import Image from "next/image";
import Link from "next/link";

import { resolveLogo } from "@/lib/site-logos";
import type { ManagedImageAsset } from "@/types/home-assets";

type PublicHeaderLogoProps = {
  logo?: ManagedImageAsset;
  variant: "mobile" | "desktop";
};

/**
 * Logo da Papelito no cabeçalho público.
 *
 * Usa o mesmo ativo das rotas privadas: o header público também é preto, e a
 * versão escura do logo sumia nele.
 */
export function PublicHeaderLogo({ logo, variant }: PublicHeaderLogoProps) {
  const resolved = resolveLogo("privateHeader", logo);

  if (variant === "mobile") {
    return (
      <Link aria-label="Ir para a home" href="/">
        <Image
          alt={resolved.alt}
          className="h-9 w-auto"
          height={73}
          priority
          src={resolved.imageUrl}
          width={123}
        />
      </Link>
    );
  }

  return (
    <Link aria-label="Ir para a home" className="justify-self-start px-4" href="/">
      <Image
        alt={resolved.alt}
        className="h-18.25 w-auto"
        height={73}
        priority
        src={resolved.imageUrl}
        width={123}
      />
    </Link>
  );
}
