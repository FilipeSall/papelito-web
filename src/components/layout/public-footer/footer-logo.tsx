import Image from "next/image";
import { FooterSocialLinks } from "./footer-social-links";

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
export function FooterLogo() {
  return (
    <div className="flex flex-col gap-5 max-w-[274px]">
      <Image
        src="/images/logo3.svg"
        alt="Papelito"
        width={183}
        height={31}
        className="h-[31px]"
      />
      <p className="text-sm leading-[22.75px] tracking-[-0.15px] text-white/60">
        A primeira e unica industria de papeis para enrolar do Brasil.
        Qualidade, inovacao e sustentabilidade.
      </p>
      <FooterSocialLinks />
    </div>
  );
}
