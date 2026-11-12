import { Trash2 } from "lucide-react";
import Image from "next/image";

import { formatCents } from "@/features/expocannabis/utils/cart";

import { MiniCounter } from "./mini-counter";

type OrderLineProps = {
  name: string;
  imageUrl: string;
  qty: number;
  unitCents: number;
  max: number;
  minusLabel?: string;
  plusLabel?: string;
  removeLabel?: string;
  onChange: (qty: number) => void;
  onRemove: () => void;
};

/** Linha do pedido: miniatura, nome, "qty × preço", contador claro e lixeira de 44 px. Serve a produtos e ao kit. */
export function OrderLine({ name, imageUrl, qty, unitCents, max, minusLabel, plusLabel, removeLabel, onChange, onRemove }: Readonly<OrderLineProps>) {
  return (
    <li className="flex items-center gap-3 border-b border-[#F0F0F1] py-3">
      <div className="relative h-11.5 w-13 flex-none rounded-md bg-[#F4F4F5]">
        {imageUrl ? <Image src={imageUrl} alt="" fill sizes="52px" className="object-contain p-0.75" unoptimized /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-bold leading-tight">{name}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-[#52525b]">{`${qty} × ${formatCents(unitCents)}`}</p>
      </div>
      <MiniCounter
        qty={qty}
        max={max}
        minusLabel={minusLabel ?? `Tirar 1 de ${name}`}
        plusLabel={plusLabel ?? `Colocar 1 de ${name}`}
        onChange={onChange}
      />
      <button
        type="button"
        aria-label={removeLabel ?? `Remover ${name} do pedido`}
        onClick={onRemove}
        className="flex size-11 flex-none items-center justify-center rounded-md bg-[#F4F4F5] text-[#B42318] transition-[transform,background-color] duration-120 hover:bg-[#FDE7E5] active:scale-92 motion-reduce:transition-none"
      >
        <Trash2 aria-hidden size={20} strokeWidth={2.2} />
      </button>
    </li>
  );
}
