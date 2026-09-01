import Image from "next/image";
import { Tag } from "@/components/ui";
import type { PartnerBannerConfig } from "@/types/home-assets";
import { PdvPerfeitoLogo } from "./pdv-perfeito-logo";
import { PartnerBannerCta } from "./partner-banner-cta";

/**
 * Fecho do corredor: o convite ao programa PDV Perfeito.
 * A foto ocupa a metade direita inteira, sangrando até a borda da tela.
 */
export function PartnerBanner({ banner }: Readonly<{ banner: PartnerBannerConfig }>) {
  return (
    <section className="relative w-full overflow-hidden bg-brand-yellow">
      <div className="mx-auto max-w-391">
        <div className="relative flex min-h-113 flex-col lg:flex-row lg:items-center">
          <div className="z-10 flex flex-col items-start gap-6 px-6.75 pb-8 pt-14 sm:px-8 lg:max-w-160 lg:px-12 lg:py-16 xl:px-43.5">
            <Tag>{banner.tag}</Tag>

            <PdvPerfeitoLogo className="w-full max-w-64.25 sm:max-w-110.25" />

            <p className="max-w-115 text-base font-medium leading-6 text-brand-dark">
              {banner.description}
            </p>

            <PartnerBannerCta href={banner.href}>{banner.ctaLabel}</PartnerBannerCta>
          </div>

          <div className="relative mt-0 h-105.75 w-full lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-190.5">
            <Image
              alt={banner.alt}
              className="object-cover object-center lg:hidden"
              fill
              sizes="100vw"
              src={banner.mobileImageUrl}
            />
            <div className="relative hidden h-full w-full overflow-hidden lg:block">
              <Image
                alt={banner.alt}
                className="object-cover object-[center_top]"
                fill
                sizes="(max-width: 1023px) 0vw, 762px"
                src={banner.desktopImageUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
