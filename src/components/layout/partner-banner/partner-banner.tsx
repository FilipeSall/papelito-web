import Image from "next/image";
import { Tag } from "@/components/ui";
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
    <section className="relative w-full overflow-hidden bg-brand-yellow">
      <div className="mx-auto max-w-391">
        {/* TODO: Substituir por requisição ao backend — GET /api/banners/partner
            Conteúdo do banner parceiro (tag, descrição, CTA, imagem) deve vir do CMS/backend. */}
        <div className="relative flex min-h-113 flex-col lg:flex-row lg:items-center">
          {/* Content - Top on mobile / Left on desktop */}
          <div className="z-10 flex flex-col gap-4 px-[27px] pt-16 pb-6 sm:px-8 lg:gap-6 lg:px-12 lg:pt-10 lg:pb-16 xl:px-43.5">
            <Tag>🤝 Seja um Parceiro</Tag>

            <PdvPerfeitoLogo className="w-full max-w-[257px] sm:max-w-110.25" />

            <p className="max-w-[246px] text-base leading-6 tracking-[-0.3125px] text-brand-dark/70 sm:max-w-114.75">
              Junte-se ao nosso PDV Perfeito com lojistas em todo o Brasil.
              Receba brindes, prêmios e benefícios exclusivos
            </p>

            <PartnerBannerCta href="/parceiros">
              Quero ser um parceiro
            </PartnerBannerCta>
          </div>

          {/* Image - Bottom on mobile / Right on desktop */}
          <div className="relative mt-0 h-[423px] w-full lg:absolute lg:top-0 lg:right-0 lg:h-full lg:w-190.5">
            <Image
              src="/images/pdv-mobile.jpg"
              alt="Parceiros PDV Perfeito sorrindo"
              fill
              className="object-cover object-center lg:hidden"
              sizes="100vw"
            />
            <div className="relative hidden h-full w-full overflow-hidden lg:block">
              <Image
                src="/images/CT1A3510 1.png"
                alt="Parceiros PDV Perfeito sorrindo"
                fill
                className="object-cover object-[center_top]"
                sizes="(max-width: 1023px) 0vw, 762px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
