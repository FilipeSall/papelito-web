import {
  REVENDEDOR_BENEFITS,
  REVENDEDOR_BENEFITS_HEADER,
} from "@/features/revendedor";
import { RevendedorCtaButton } from "../atoms/revendedor-cta-button";
import { RevendedorSectionEyebrow } from "../atoms/revendedor-section-eyebrow";
import { RevendedorBenefitCard } from "../molecules/revendedor-benefit-card";

/**
 * Apresenta os beneficios do programa com CTA para o catalogo de produtos.
 */
export function RevendedorBenefitsSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1564px] px-4 lg:px-[206px]">
        <div className="mx-auto max-w-[1152px]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[487px]">
              <RevendedorSectionEyebrow>
                {REVENDEDOR_BENEFITS_HEADER.eyebrow}
              </RevendedorSectionEyebrow>
              <h2 className="mt-2 text-4xl font-black uppercase leading-[1.2] tracking-[0.3516px] text-brand-dark lg:text-5xl lg:leading-[60px]">
                <span className="block">{REVENDEDOR_BENEFITS_HEADER.titlePrefix}</span>
                <span className="block text-brand-yellow">
                  {REVENDEDOR_BENEFITS_HEADER.titleHighlight}
                </span>
              </h2>
            </div>

            <RevendedorCtaButton compact href="/produtos" variant="outline">
              {REVENDEDOR_BENEFITS_HEADER.ctaLabel}
            </RevendedorCtaButton>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {REVENDEDOR_BENEFITS.map((benefit) => (
              <RevendedorBenefitCard benefit={benefit} key={benefit.title} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
