import Image from "next/image";
import {
  REVENDEDOR_BUSINESS_TYPES,
  REVENDEDOR_BUSINESS_TYPES_HEADER,
} from "@/features/revendedor";
import type { ManagedImageAsset } from "@/types/home-assets";
import { RevendedorCtaButton } from "../atoms/revendedor-cta-button";
import { RevendedorSectionEyebrow } from "../atoms/revendedor-section-eyebrow";
import { RevendedorBusinessListItem } from "../molecules/revendedor-business-list-item";

/**
 * Mostra o mosaico de imagens e a lista de formatos comerciais atendidos.
 */
export function RevendedorBusinessTypesSection({
  illustrationImage,
  mainImage,
  secondaryImage,
}: {
  illustrationImage?: ManagedImageAsset;
  mainImage?: ManagedImageAsset;
  secondaryImage?: ManagedImageAsset;
}) {
  const useDefaultIllustration =
    !illustrationImage || illustrationImage.imageUrl === "/images/revendedor/business-card-vector.svg";

  return (
    <section className="bg-bg-light py-20">
      <div className="mx-auto max-w-[1088px] px-4 md:px-8 lg:px-0">
        <div className="grid items-center gap-10 lg:grid-cols-[516px_516px] lg:gap-14">
          <div className="relative mx-auto grid w-full max-w-129 gap-4 md:grid-cols-[250px_250px] md:grid-rows-[200px_200px] lg:mx-0">
            <div className="relative min-h-100 overflow-hidden rounded-2xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] md:row-span-2">
              <Image
                alt={mainImage?.alt || "Parceira Papelito sorrindo em um ponto de venda"}
                className="object-cover"
                fill
                sizes="(min-width: 768px) 250px, 50vw"
                src={mainImage?.imageUrl || "/images/revendedor/business-main.jpg"}
              />
            </div>

            <div className="relative min-h-50 overflow-hidden rounded-2xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
              <Image
                alt={secondaryImage?.alt || "Equipe parceira Papelito em loja"}
                className="object-cover"
                fill
                sizes="(min-width: 768px) 250px, 50vw"
                src={secondaryImage?.imageUrl || "/images/revendedor/business-secondary.jpg"}
              />
            </div>

            <div className="relative flex min-h-50 items-center justify-center overflow-hidden rounded-2xl bg-brand-yellow shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]">
              {!useDefaultIllustration && illustrationImage ? (
                <div className="relative h-44.5 w-36.75">
                  <Image
                    alt={illustrationImage.alt}
                    className="object-contain"
                    fill
                    sizes="147px"
                    src={illustrationImage.imageUrl}
                  />
                </div>
              ) : (
                <div className="relative h-44.5 w-36.75">
                  <div className="absolute left-0 top-9.5 h-29.5 w-27">
                    <Image
                      alt=""
                      className="object-contain"
                      fill
                      src="/images/revendedor/business-card-vector.svg"
                    />
                  </div>
                  <div className="absolute left-3.5 top-0 h-19 w-18.75">
                    <Image
                      alt=""
                      className="object-contain"
                      fill
                      src="/images/revendedor/business-card-group-top.svg"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 h-22.25 w-33.75">
                    <Image
                      alt=""
                      className="object-contain"
                      fill
                      src="/images/revendedor/business-card-group-bottom.svg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-129 lg:mx-0">
            <RevendedorSectionEyebrow>
              {REVENDEDOR_BUSINESS_TYPES_HEADER.eyebrow}
            </RevendedorSectionEyebrow>
            <h2 className="mt-3 text-3xl font-black uppercase leading-[1.15] tracking-[0.3691px] text-brand-dark lg:text-4xl lg:leading-11.25">
              <span className="block">{REVENDEDOR_BUSINESS_TYPES_HEADER.titlePrefix}</span>
              <span className="block text-brand-yellow">
                {REVENDEDOR_BUSINESS_TYPES_HEADER.titleHighlight}
              </span>
            </h2>

            <ul className="mt-8 flex flex-col gap-3">
              {REVENDEDOR_BUSINESS_TYPES.map((item) => (
                <RevendedorBusinessListItem item={item} key={item.label} />
              ))}
            </ul>

            <RevendedorCtaButton className="mt-10" href="#revendedor-form">
              {REVENDEDOR_BUSINESS_TYPES_HEADER.ctaLabel}
            </RevendedorCtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
