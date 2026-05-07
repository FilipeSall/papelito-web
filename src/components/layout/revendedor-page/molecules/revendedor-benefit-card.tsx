import Image from "next/image";
import type { RevendedorBenefit } from "@/features/revendedor";

type RevendedorBenefitCardProps = {
  benefit: RevendedorBenefit;
};

/**
 * Card de beneficio com icone, titulo e descricao do programa.
 */
export function RevendedorBenefitCard({
  benefit,
}: RevendedorBenefitCardProps) {
  return (
    <article className="relative min-h-[225.5px] overflow-hidden rounded-[16px] bg-bg-light p-7">
      <div className="absolute right-0 top-0 size-24 rounded-bl-[64px] bg-brand-yellow/5" />

      <div className="relative flex h-full flex-col">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-brand-yellow">
          <Image alt="" height={22} src={benefit.iconSrc} width={22} />
        </div>

        <h3 className="mt-5 min-h-11 max-w-[201px] text-base font-black leading-[22px] tracking-[-0.3125px] text-brand-dark">
          {benefit.title}
        </h3>

        <p className="mt-2 max-w-[201px] text-sm leading-[22.75px] tracking-[-0.1504px] text-text-tertiary">
          {benefit.description}
        </p>
      </div>
    </article>
  );
}
