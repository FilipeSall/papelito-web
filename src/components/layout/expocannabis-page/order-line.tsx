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
  /** Linha estreita do painel lateral: miniatura menor e nada quebra em duas linhas. */
  compact?: boolean;
  onChange: (qty: number) => void;
  onRemove: () => void;
};

/** Linha do pedido: miniatura que pula na mudança, nome, "qty × preço", contador e lixeira de 44 px. */
export function OrderLine({ name, imageUrl, qty, unitCents, max, minusLabel, plusLabel, removeLabel, compact = false, onChange, onRemove }: Readonly<OrderLineProps>) {
  const thumb = useJump<HTMLSpanElement>(qty);

  return (
    <li className={`flex items-center border-b border-expo-linha ${compact ? "gap-2.5 py-2.5" : "flex-wrap gap-3 py-3"}`}>
      <span className={`flex flex-none items-center justify-center bg-white p-0.75 ${compact ? "size-12" : "size-16"}`}>
        <span ref={thumb} className={`relative block ${compact ? "size-10.5" : "size-14.5"}`}>
          {imageUrl ? <Image src={imageUrl} alt="" fill sizes="64px" className="object-contain" unoptimized /> : null}
        </span>
      </span>
      <div className={compact ? "min-w-0 flex-1" : "min-w-45 flex-1"}>
        <p className={`font-bold leading-[1.25] ${compact ? "line-clamp-2 text-[15px]" : "text-[18px] leading-[1.3]"}`}>{name}</p>
        <p className={`num font-semibold text-expo-mute ${compact ? "mt-0.5 text-[13px]" : "mt-1 text-[15px]"}`}>{`${qty} × ${formatCents(unitCents)}`}</p>
      </div>
      <div className={`flex items-center ${compact ? "gap-1" : "gap-3 max-sm:ml-19"}`}>
        <MiniCounter
          qty={qty}
          max={max}
          small={compact}
          minusLabel={minusLabel ?? `Tirar 1 de ${name}`}
          plusLabel={plusLabel ?? `Colocar 1 de ${name}`}
          onChange={onChange}
        />
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
