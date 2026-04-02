import Image from "next/image";

interface FeatureItemProps {
  icon: string;
  title: string;
  subtitle: string;
  isLast?: boolean;
}

/**
 * Item atômico de benefício exibido na barra de features.
 *
 * Renderiza um ícone em círculo amarelo seguido de título em negrito
 * e subtítulo em cinza. A borda direita é omitida no último item da lista.
 */
export function FeatureItem({
  icon,
  title,
  subtitle,
  isLast = false,
}: FeatureItemProps) {
  return (
    <div
      className={`flex flex-1 flex-row items-center pl-6 gap-3 h-[72px]${
        !isLast ? " border-r border-[#F3F4F6]" : ""
      }`}
    >
      <div className="flex items-center justify-center w-9 h-9 bg-[#FFE500] rounded-full shrink-0">
        <Image src={icon} alt="" aria-hidden width={16} height={16} />
      </div>

      <div className="flex flex-col">
        <span className="font-black text-sm leading-5 tracking-[-0.150391px] text-[#231F20]">
          {title}
        </span>
        <span className="text-xs leading-4 text-[#99A1AF]">{subtitle}</span>
      </div>
    </div>
  );
}
