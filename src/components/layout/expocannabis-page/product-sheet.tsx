"use client";

import Image from "next/image";

import { BaseModal } from "@/components/ui/base-modal";
import { EXPO_SCOPE_CLASS } from "@/features/expocannabis/fonts";
import type { EventProduct } from "@/features/expocannabis/types/context";
import { discountedCents, formatCents, maxQty } from "@/features/expocannabis/utils/cart";

import { MiniCounter } from "./mini-counter";
import { useJump } from "./motion";
import { Paper } from "./paper";
import { QuickQty } from "./quick-qty";

type ProductSheetProps = {
  product: EventProduct | null;
  qty: number;
  pctBp: number;
  onChange: (qty: number) => void;
  onClose: () => void;
};

const NO_DESCRIPTION = "Descrição completa na página do produto no marketplace.";

function ProductInfo({ product, pctBp, onClose }: Readonly<{ product: EventProduct; pctBp: number; onClose: () => void }>) {
  const unit = discountedCents(product.priceCents, pctBp);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-expo-mute">{product.category.name}</p>
        <button
          type="button"
          aria-label="Fechar detalhe"
          onClick={onClose}
          className="flex size-11 flex-none items-center justify-center border border-expo-ink text-[22px]"
        >
          ×
        </button>
      </div>
      <h2 id="expo-product-title" className="ultra max-w-[412px] text-[30px] leading-[33px]">
        {product.name}
      </h2>
      <p className="text-[15px] font-medium leading-[1.45]">{product.description || NO_DESCRIPTION}</p>
      <ul className="flex flex-col gap-1">
        {product.specs.map((spec) => (
          <li key={spec.label} className="text-[15px] font-medium text-expo-mute">{`— ${spec.label}: ${spec.value}`}</li>
        ))}
      </ul>
      <p className="num flex flex-wrap items-baseline gap-2 pt-1.5">
        <span className="text-[28px] font-bold">{formatCents(unit)}</span>
        {pctBp > 0 ? <s className="text-[15px] font-semibold text-expo-mute">{formatCents(product.priceCents)}</s> : null}
        <span className="text-[15px] text-expo-mute">por display</span>
      </p>
    </div>
  );
}

/**
 * Ficha do produto em folha colada embaixo: foto que pula na mudança, descrição, especificações,
 * preço do nível e quantidade. Na paisagem a camada cobre só a vitrine, deixando o painel do
 * pedido à vista para a pessoa ver o total mudar enquanto escolhe.
 */
export function ProductSheet({ product, qty, pctBp, onChange, onClose }: Readonly<ProductSheetProps>) {
  const picture = useJump<HTMLSpanElement>(qty);
  if (!product) return null;
  const unit = discountedCents(product.priceCents, pctBp);
  const max = maxQty(product);

  return (
    <BaseModal
      open
      onClose={onClose}
      ariaLabelledBy="expo-product-title"
      containerClassName={`${EXPO_SCOPE_CLASS} items-end justify-center pz:right-[440px]`}
      overlayClassName="bg-black/60"
    >
      <div className="expo-sobe em-claro relative mx-auto max-w-[820px] bg-white text-expo-ink">
        <Paper src="/images/expocannabis/figma/papel-ficha-produto.svg" />
        <div className="relative flex max-h-[88dvh] flex-col gap-6 overflow-y-auto p-5 sm:p-8">
          <div className="flex gap-5 max-sm:flex-col">
            <span className="flex size-50 flex-none items-center justify-center bg-white sm:size-65">
              <span ref={picture} className="relative block size-47.5 sm:size-61">
                {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="260px" className="object-contain" unoptimized /> : null}
              </span>
            </span>
            <ProductInfo product={product} pctBp={pctBp} onClose={onClose} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MiniCounter
              qty={qty}
              max={max}
              large
              minusLabel={`Tirar 1 de ${product.name}`}
              plusLabel={`Colocar 1 de ${product.name}`}
              onChange={onChange}
            />
            <QuickQty productName={product.name} qty={qty} max={max} onSet={onChange} tall />
            <button type="button" onClick={onClose} className="flex min-h-14 min-w-55 flex-1 items-center justify-between gap-3 bg-brand-yellow px-4">
              <span className="text-[18px] font-extrabold">Pronto</span>
              <span className="num text-[20px] font-bold">{formatCents(unit * qty)}</span>
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
