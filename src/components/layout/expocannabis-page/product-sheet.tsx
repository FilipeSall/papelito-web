"use client";

import Image from "next/image";

import { BaseModal } from "@/components/ui/base-modal";
import { EXPO_SCOPE_CLASS } from "@/features/expocannabis/fonts";
import type { EventProduct } from "@/features/expocannabis/types/context";
import { discountedCents, formatCents, maxQty } from "@/features/expocannabis/utils/cart";

import { MiniCounter } from "./mini-counter";
import { QuickQty } from "./quick-qty";

type ProductSheetProps = {
  product: EventProduct | null;
  qty: number;
  pctBp: number;
  onChange: (qty: number) => void;
  onClose: () => void;
};

const NO_DESCRIPTION = "Descrição completa na página do produto no marketplace.";

function ProductInfo({ product, pctBp }: Readonly<{ product: EventProduct; pctBp: number }>) {
  const unit = discountedCents(product.priceCents, pctBp);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#52525b]">{product.category.name}</p>
      <h2 id="expo-product-title" className="text-2xl font-extrabold leading-[1.2]">
        {product.name}
      </h2>
      <p className="text-[15px] font-medium leading-[1.45]">{product.description || NO_DESCRIPTION}</p>
      {product.specs.map((spec) => (
        <p key={spec.label} className="text-sm font-medium text-[#52525b]">{`· ${spec.label}: ${spec.value}`}</p>
      ))}
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[22px] font-extrabold">{formatCents(unit)}</span>
        {pctBp > 0 ? <s className="text-[13px] font-semibold text-[#52525b]">{formatCents(product.priceCents)}</s> : null}
        <span className="text-sm text-[#52525b]">por display</span>
      </div>
    </div>
  );
}

/**
 * Detalhe do produto em folha colada embaixo: imagem, descrição, ficha, preço e quantidade.
 * Na paisagem a camada cobre só a área principal, deixando o painel do pedido à vista.
 */
export function ProductSheet({ product, qty, pctBp, onChange, onClose }: Readonly<ProductSheetProps>) {
  if (!product) return null;
  const unit = discountedCents(product.priceCents, pctBp);
  const max = maxQty(product);

  return (
    <BaseModal
      open
      onClose={onClose}
      ariaLabelledBy="expo-product-title"
      containerClassName={`${EXPO_SCOPE_CLASS} items-end min-[1024px]:right-90`}
      overlayClassName="bg-black/45 expo-dim"
    >
      <div className="expo-sheet relative flex max-h-[88dvh] flex-col gap-4.5 overflow-y-auto rounded-t-xl bg-white px-7 pb-6 pt-7 text-[#231F20]">
        <div className="flex gap-5.5">
          <div className="relative flex h-50 w-60 flex-none items-center justify-center rounded-[10px] bg-[#F4F4F5]">
            <div className="relative h-42.5 w-52.5">
              {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="210px" className="object-contain" unoptimized /> : null}
            </div>
          </div>
          <ProductInfo product={product} pctBp={pctBp} />
          <button type="button" aria-label="Fechar detalhe" onClick={onClose} className="size-11 flex-none rounded-md bg-[#F4F4F5] text-[22px]">
            ×
          </button>
        </div>
        <div className="flex items-center gap-3">
          <MiniCounter
            qty={qty}
            max={max}
            large
            minusLabel={`Tirar 1 de ${product.name}`}
            plusLabel={`Colocar 1 de ${product.name}`}
            onChange={onChange}
          />
          <QuickQty productName={product.name} qty={qty} max={max} onSet={onChange} tall />
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-14 flex-1 items-center justify-between rounded-lg bg-brand-yellow px-5 text-lg font-extrabold transition-transform duration-120 active:scale-95 motion-reduce:transition-none"
          >
            <span>Pronto</span>
            <span>{formatCents(unit * qty)}</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
