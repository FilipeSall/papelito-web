import Image from "next/image";
import type { RevendedorBusinessType } from "@/features/revendedor";

type RevendedorBusinessListItemProps = {
  item: RevendedorBusinessType;
};

/**
 * Item de lista para os formatos de negocio atendidos pela Papelito.
 */
export function RevendedorBusinessListItem({
  item,
}: RevendedorBusinessListItemProps) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E4E4E4]">
        <Image
          alt=""
          className="size-3.5"
          height={14}
          src="/images/revendedor/business-check.svg"
          width={14}
        />
      </span>
      <span className="text-base font-black leading-6 tracking-[-0.3125px] text-brand-dark">
        {item.label}
      </span>
    </li>
  );
}
