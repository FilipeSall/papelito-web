import Image from "next/image";
import { StarIcon } from "@/components/ui/icons";
import type { RevendedorTestimonial } from "@/features/revendedor";

type RevendedorTestimonialCardProps = {
  testimonial: RevendedorTestimonial;
};

/**
 * Card de prova social com depoimento, avatar e nota visual fixa.
 */
export function RevendedorTestimonialCard({
  testimonial,
}: RevendedorTestimonialCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-7">
      <span className="text-6xl font-black leading-none text-brand-yellow/30">
        &quot;
      </span>

      <p className="mt-5 min-h-[136px] text-sm italic leading-[22.75px] tracking-[-0.1504px] text-white/80">
        {testimonial.quote}
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-brand-yellow">
          <Image
            alt={testimonial.avatarAlt}
            className="h-full w-full object-cover"
            height={40}
            src={testimonial.avatarSrc}
            width={40}
          />
        </div>

        <div>
          <p className="text-sm font-black tracking-[-0.1504px] text-white">
            {testimonial.name}
          </p>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon key={index} filled />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
