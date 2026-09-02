import type { ReactNode } from "react";
import Image from "next/image";

interface FeatureItemProps {
  iconUrl: string;
  title: string;
  subtitle: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Item atômico de benefício exibido na barra de features.
 *
 * Renderiza um ícone em círculo amarelo seguido de título em negrito
 * e subtítulo em cinza. A borda direita é omitida no último item da lista.
 */
export function FeatureItem({
  iconUrl,
  title,
  subtitle,
  className,
  contentClassName,
}: FeatureItemProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <div className="flex items-center justify-center w-9 h-9 bg-[#FFE500] rounded-full shrink-0">
        <Image src={iconUrl} alt="" aria-hidden width={16} height={16} />
      </div>

      <div className={`flex flex-col ${contentClassName ?? ""}`}>
        <span className="font-black text-sm leading-5 tracking-[-0.150391px] text-[#231F20]">
          {title}
        </span>
        <span className="text-xs leading-4 text-[#99A1AF]">{subtitle}</span>
      </div>
    </div>
  );
}
