import Image from "next/image";
import { PartnerBannerTag } from "./partner-banner-tag";
import { PdvPerfeitoLogo } from "./pdv-perfeito-logo";
import { PartnerBannerCta } from "./partner-banner-cta";

/**
 * Seção de banner para programa de parceiros PDV Perfeito.
 *
 * Componente de layout que exibe uma seção promocional convidando
 * lojistas a se tornarem parceiros do programa PDV Perfeito.
 *
 * Estrutura:
 * - Lado esquerdo: Tag, logo PDV Perfeito, descrição e botão CTA
 * - Lado direito: Imagem dos parceiros
 *
 * Cores utilizadas:
 * - Fundo: `brand-yellow` (#FFE500)
 * - Texto: `brand-dark` (#231F20)
 *
 * @example
 * ```tsx
 * // Uso básico na página principal
 * <PartnerBanner />
 * ```
 */
export function PartnerBanner() {
  return (
    <section className="w-full bg-brand-yellow relative overflow-hidden">
      <div className="max-w-391 mx-auto flex items-center min-h-113">
        {/* Content - Left Side */}
        <div className="flex flex-col gap-6 pt-10 pb-16 px-12 lg:px-43.5 z-10">
          <PartnerBannerTag>🤝 Seja um Parceiro</PartnerBannerTag>

          <PdvPerfeitoLogo className="w-full max-w-110.25" />

          <p className="text-base leading-6 tracking-[-0.3125px] text-brand-dark/80 max-w-114.75">
            Junte-se ao nosso PDV Perfeito com lojistas em todo o Brasil. Receba
            brindes, prêmios e benefícios exclusivos
          </p>

          <PartnerBannerCta href="/parceiros">
            Quero ser um parceiro
          </PartnerBannerCta>
        </div>

        {/* Image - Right Side */}
        <div className="absolute right-0 top-0 h-full w-190.5 hidden lg:block">
          <Image
            src="/images/CT1A3510 1.png"
            alt="Parceiros PDV Perfeito sorrindo"
            fill
            className="object-cover object-[center_top]"
            sizes="(max-width: 1024px) 0vw, 762px"
          />
        </div>
      </div>
    </section>
  );
}
