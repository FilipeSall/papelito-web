import Image from "next/image";
import { PdvPerfeitoLogo } from "@/components/layout/partner-banner/pdv-perfeito-logo";
import { REVENDEDOR_HERO_CONTENT } from "@/features/revendedor";

/**
 * Bloco visual do hero com ilustração e copy principal do programa PDV Perfeito.
 */
export function RevendedorHeroIllustration() {
  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col pt-4 lg:pt-[132px]">
      <Image
        alt=""
        className="w-full max-w-[428px]"
        height={325}
        src="/images/revendedor/hero-storefront.svg"
        width={428}
      />

      <div className="mt-12 max-w-[384px]">
        <div className="text-4xl font-black uppercase leading-[1.1] tracking-[0.3516px] text-white lg:text-5xl lg:leading-[48px]">
          <span className="block">{REVENDEDOR_HERO_CONTENT.titlePrefix}</span>
          <span className="block text-brand-yellow">
            {REVENDEDOR_HERO_CONTENT.titleHighlight}
          </span>
        </div>

        <p className="mt-4 text-base leading-[26px] tracking-[-0.3125px] text-white/60">
          {REVENDEDOR_HERO_CONTENT.description}
        </p>
      </div>

      <div className="sr-only">
        <PdvPerfeitoLogo />
      </div>
    </div>
  );
}
