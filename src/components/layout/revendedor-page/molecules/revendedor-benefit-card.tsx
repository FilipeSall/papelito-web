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
    <article className="relative overflow-hidden rounded-2xl bg-bg-light p-7">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-16 bg-brand-yellow/5" />

      <div className="relative flex h-full flex-col">
        <div className="flex size-13 items-center justify-center rounded-3.5 bg-brand-yellow">
          <Image alt="" height={22} src={benefit.iconSrc} width={22} />
        </div>

        <h3 className="mt-5 text-base font-black leading-5.5 tracking-[-0.3125px] text-brand-dark">
          {benefit.title}
        </h3>

        <p className="mt-2 text-sm leading-5.6875 tracking-[-0.1504px] text-text-tertiary">
          {benefit.description}
        </p>
      </div>
    </article>
  );
}
