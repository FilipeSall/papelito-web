import { Trash2 } from "lucide-react";
import Image from "next/image";

import { formatCents } from "@/features/expocannabis/utils/cart";

import { Stepper } from "./stepper";

type OrderLineProps = {
  name: string;
  imageUrl: string;
  qty: number;
  unitCents: number;
  max: number;
  onChange: (qty: number) => void;
  onRemove: () => void;
};

/** Linha do pedido: miniatura, nome, "qty × preço", contador e lixeira. */
export function OrderLine({ name, imageUrl, qty, unitCents, max, onChange, onRemove }: Readonly<OrderLineProps>) {
  return (
    <li className="flex items-center gap-3 border-b border-[#E4E4E7] py-3">
      <div className="relative h-[46px] w-[52px] flex-none overflow-hidden rounded-sm bg-[#F4F4F5]">
        {imageUrl ? <Image src={imageUrl} alt="" fill sizes="52px" className="object-contain" unoptimized /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15px] font-bold leading-tight">{name}</p>
        <p className="text-sm text-[#52525B]">{`${qty} × ${formatCents(unitCents)}`}</p>
      </div>
      <div className="w-[132px]">
        <Stepper productName={name} qty={qty} max={max} onChange={onChange} size="sm" />
      </div>
      <button type="button" aria-label={`Remover ${name} do pedido`} onClick={onRemove} className="grid h-11 w-11 place-items-center text-[#B42318]">
        <Trash2 aria-hidden size={22} />
      </button>
    </li>
  );
}
