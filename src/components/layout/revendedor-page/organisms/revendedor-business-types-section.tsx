import Image from "next/image";
import {
  REVENDEDOR_BUSINESS_TYPES,
  REVENDEDOR_BUSINESS_TYPES_HEADER,
} from "@/features/revendedor";
import { RevendedorCtaButton } from "../atoms/revendedor-cta-button";
import { RevendedorSectionEyebrow } from "../atoms/revendedor-section-eyebrow";
import { RevendedorBusinessListItem } from "../molecules/revendedor-business-list-item";

/**
 * Mostra o mosaico de imagens e a lista de formatos comerciais atendidos.
 */
export function RevendedorBusinessTypesSection() {
  return (
    <section className="bg-bg-light py-20">
      <div className="mx-auto max-w-[1564px] px-4 lg:px-12 2xl:px-[238px]">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,516px)_minmax(0,516px)] lg:justify-between">
          <div className="relative mx-auto grid w-full max-w-[516px] gap-4 md:grid-cols-[250px_250px] md:grid-rows-[200px_200px] lg:mx-0">
            <div className="relative min-h-[400px] overflow-hidden rounded-2xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] md:row-span-2">
              <Image
                alt="Parceira Papelito sorrindo em um ponto de venda"
                className="object-cover"
                fill
                sizes="(min-width: 768px) 250px, 50vw"
                src="/images/revendedor/business-main.jpg"
              />
            </div>

            <div className="relative min-h-[200px] overflow-hidden rounded-2xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
              <Image
                alt="Equipe parceira Papelito em loja"
                className="object-cover"
                fill
                sizes="(min-width: 768px) 250px, 50vw"
                src="/images/revendedor/business-secondary.jpg"
              />
            </div>

            <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-2xl bg-brand-yellow shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]">
              <div className="relative h-[178px] w-[147px]">
                <div className="absolute left-0 top-[38px] h-[118px] w-[108px]">
                  <Image
                    alt=""
                    className="object-contain"
                    fill
                    src="/images/revendedor/business-card-vector.svg"
                  />
                </div>
                <div className="absolute left-[14px] top-0 h-[76px] w-[75px]">
                  <Image
                    alt=""
                    className="object-contain"
                    fill
                    src="/images/revendedor/business-card-group-top.svg"
                  />
                </div>
                <div className="absolute bottom-0 right-0 h-[89px] w-[135px]">
                  <Image
                    alt=""
                    className="object-contain"
                    fill
                    src="/images/revendedor/business-card-group-bottom.svg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[516px] lg:mx-0">
            <RevendedorSectionEyebrow>
              {REVENDEDOR_BUSINESS_TYPES_HEADER.eyebrow}
            </RevendedorSectionEyebrow>
            <h2 className="mt-3 text-3xl font-black uppercase leading-[1.15] tracking-[0.3691px] text-brand-dark lg:text-[36px] lg:leading-[45px]">
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
