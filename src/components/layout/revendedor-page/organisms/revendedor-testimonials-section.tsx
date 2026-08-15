import {
  REVENDEDOR_TESTIMONIALS,
  REVENDEDOR_TESTIMONIALS_HEADER,
} from "@/features/revendedor";
import { RevendedorCtaButton } from "../atoms/revendedor-cta-button";
import { RevendedorSectionEyebrow } from "../atoms/revendedor-section-eyebrow";
import { RevendedorTestimonialCard } from "../molecules/revendedor-testimonial-card";

/**
 * Seção escura com prova social e CTA de retorno ao formulario.
 */
export function RevendedorTestimonialsSection() {
  return (
    <section className="bg-brand-dark py-20">
      <div className="mx-auto max-w-[1088px] px-4 md:px-8 lg:px-0">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-194.25">
            <RevendedorSectionEyebrow tone="light">
              {REVENDEDOR_TESTIMONIALS_HEADER.eyebrow}
            </RevendedorSectionEyebrow>
            <h2 className="mt-2 text-4xl font-black uppercase leading-[1.2] tracking-[0.3516px] text-white lg:text-5xl lg:leading-15">
              <span className="block">{REVENDEDOR_TESTIMONIALS_HEADER.titlePrefix}</span>
              <span className="block text-brand-yellow">
                {REVENDEDOR_TESTIMONIALS_HEADER.titleHighlight}
              </span>
            </h2>
          </div>

          <RevendedorCtaButton compact href="#revendedor-form">
            {REVENDEDOR_TESTIMONIALS_HEADER.ctaLabel}
          </RevendedorCtaButton>
        </div>

        <div className="mt-14 grid gap-6 xl:grid-cols-3">
          {REVENDEDOR_TESTIMONIALS.map((testimonial) => (
            <RevendedorTestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
