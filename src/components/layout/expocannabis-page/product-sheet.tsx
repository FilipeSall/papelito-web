"use client";

import Image from "next/image";

import { BaseModal } from "@/components/ui/base-modal";
import type { EventProduct } from "@/features/expocannabis/types/context";
import { discountedCents, formatCents, maxQty } from "@/features/expocannabis/utils/cart";

import { QuickQty } from "./quick-qty";
import { Stepper } from "./stepper";

type ProductSheetProps = {
  product: EventProduct | null;
  qty: number;
  pctBp: number;
  onChange: (qty: number) => void;
  onClose: () => void;
};

/** Detalhe do produto em folha: imagem, descrição, ficha técnica, preço e quantidade. */
export function ProductSheet({ product, qty, pctBp, onChange, onClose }: Readonly<ProductSheetProps>) {
  if (!product) return null;
  const unit = discountedCents(product.priceCents, pctBp);
  const max = maxQty(product);

  return (
    <BaseModal open onClose={onClose} ariaLabelledBy="expo-product-title" contentClassName="w-full max-w-[720px] self-end">
      <div className="expo-sheet max-h-[88dvh] overflow-y-auto rounded-t-xl bg-white p-6 text-[#231F20]">
        <div className="relative h-56 rounded-md bg-[#F4F4F5]">
          {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="720px" className="object-contain" unoptimized /> : null}
        </div>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.08em] text-[#52525B]">{product.category.name}</p>
        <h2 id="expo-product-title" className="text-[22px] font-extrabold">
          {product.name}
        </h2>
        <p className="mt-2 text-base text-[#52525B]">{product.description}</p>
        {product.specs.length > 0 ? (
          <ul className="mt-3 text-sm">
            {product.specs.map((spec) => (
              <li key={spec.label}>{`· ${spec.label}: ${spec.value}`}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 text-xl font-extrabold">
          {formatCents(unit)} <span className="text-sm font-semibold text-[#52525B]">por display</span>
        </p>
        <div className="mt-4 grid gap-3">
          <Stepper productName={product.name} qty={qty} max={max} onChange={onChange} />
          <QuickQty productName={product.name} qty={qty} max={max} onSet={onChange} tall />
          <button type="button" onClick={onClose} className="h-14 rounded-md bg-brand-yellow text-lg font-extrabold">
            {`Pronto · ${formatCents(unit * qty)}`}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
