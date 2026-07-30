import Image from "next/image";
import { FooterSocialLinks } from "./footer-social-links";

import { resolveLogo } from "@/lib/site-logos";
import type { ManagedImageAsset } from "@/types/home-assets";

type FooterLogoProps = {
  logo?: ManagedImageAsset;
};

/**
 * Secao de logo e descricao do footer.
 *
 * Componente molecular que combina o logo da Papelito,
 * uma descricao da empresa e os links de redes sociais.
 *
 * @example
 * ```tsx
 * <FooterLogo />
 * ```
 */
export function FooterLogo({ logo }: FooterLogoProps) {
  const resolved = resolveLogo("footer", logo);

  return (
    <div className="flex max-w-68.5 flex-col gap-5">
      <Image
        src={resolved.imageUrl}
        alt={resolved.alt}
        width={183}
        height={31}
        className="h-7.75 w-auto max-w-45.75"
      />
      <p className="max-w-60.75 text-sm leading-[22.75px] tracking-normal text-white/60">
        A primeira e única indústria de papéis para enrolar do Brasil.
        Qualidade, inovação e sustentabilidade.
      </p>
      <FooterSocialLinks />
    </div>
  );
}
