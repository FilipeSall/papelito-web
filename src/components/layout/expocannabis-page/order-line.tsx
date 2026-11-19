"use client";

import Image from "next/image";

import { formatCents } from "@/features/expocannabis/utils/cart";

import { MiniCounter } from "./mini-counter";
import { useJump } from "./motion";

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

/** Linha do pedido: miniatura que pula na mudança, nome, "qty × preço", contador e lixeira de 44 px. */
export function OrderLine({ name, imageUrl, qty, unitCents, max, minusLabel, plusLabel, removeLabel, onChange, onRemove }: Readonly<OrderLineProps>) {
  const thumb = useJump<HTMLSpanElement>(qty);

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-expo-linha py-3">
      <span className="flex size-16 flex-none items-center justify-center bg-white p-0.75">
        <span ref={thumb} className="relative block size-14.5">
          {imageUrl ? <Image src={imageUrl} alt="" fill sizes="64px" className="object-contain" unoptimized /> : null}
        </span>
      </span>
      <div className="min-w-45 flex-1">
        <p className="text-[18px] font-bold leading-[1.3]">{name}</p>
        <p className="num mt-1 text-[15px] font-semibold text-expo-mute">{`${qty} × ${formatCents(unitCents)}`}</p>
      </div>
      <div className="flex items-center gap-3 max-sm:ml-19">
        <MiniCounter qty={qty} max={max} minusLabel={minusLabel ?? `Tirar 1 de ${name}`} plusLabel={plusLabel ?? `Colocar 1 de ${name}`} onChange={onChange} />
        <button
          type="button"
          aria-label={removeLabel ?? `Remover ${name} do pedido`}
          onClick={onRemove}
          className="flex size-11 flex-none items-center justify-center text-expo-erro"
        >
          <Image src="/images/expocannabis/figma/icon-lixeira.svg" alt="" width={20} height={20} aria-hidden />
        </button>
      </div>
    </li>
  );
}
