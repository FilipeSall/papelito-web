import type { ReactNode } from "react";
import Image from "next/image";

interface FeatureItemProps {
  iconUrl: string;
  title: string;
  subtitle: ReactNode;
}

/**
 * Célula da régua de condições.
 * Ícone em placa amarela quadrada, título em caixa alta e a condição em texto de apoio.
 */
export function FeatureItem({ iconUrl, title, subtitle }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-4 sm:px-6">
      <span className="grid size-9 shrink-0 place-items-center bg-brand-yellow">
        <Image alt="" aria-hidden height={16} src={iconUrl} width={16} />
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[0.6875rem] font-black uppercase leading-4 tracking-[0.16em] text-white">
          {title}
        </span>
        <span className="break-words text-[0.6875rem] leading-4 text-white/70" data-numeric>
          {subtitle}
        </span>
      </span>
    </div>
  );
}
