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
      <div className="mx-auto max-w-391 px-4 md:px-8">
        <div className="mx-auto max-w-[1088px]">
          <div className="flex flex-col gap-8 lg:min-h-36 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[487px]">
              <RevendedorSectionEyebrow>
                {REVENDEDOR_BENEFITS_HEADER.eyebrow}
              </RevendedorSectionEyebrow>
              <h2 className="mt-2 text-4xl font-black uppercase leading-[1.15] tracking-[0.3516px] text-brand-dark md:text-5xl md:leading-[60px]">
                <span className="block">{REVENDEDOR_BENEFITS_HEADER.titlePrefix}</span>
                <span className="block text-brand-yellow">
                  {REVENDEDOR_BENEFITS_HEADER.titleHighlight}
                </span>
              </h2>
            </div>

            <RevendedorCtaButton
              className="h-12 w-full justify-between px-6 sm:w-auto lg:min-w-[290.297px]"
              compact
              href="/api/catalog"
              target="_blank"
              variant="outline"
            >
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
