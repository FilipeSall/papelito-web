"use client";

import Image from "next/image";

import type { EventProduct } from "@/features/expocannabis/types/context";
import { discountedCents, formatCents, maxQty } from "@/features/expocannabis/utils/cart";
import { secondaryLine, type ProductTag } from "@/features/expocannabis/utils/store-catalog";

import { useJump } from "./motion";
import { QuickQty } from "./quick-qty";
import { Stepper } from "./stepper";

type ProductCardProps = {
  product: EventProduct;
  qty: number;
  pctBp: number;
  tag?: ProductTag;
  shelf?: boolean;
  onChange: (qty: number) => void;
  onOpen: () => void;
};

function Picture({ product, qty }: Readonly<{ product: EventProduct; qty: number }>) {
  const ref = useJump<HTMLSpanElement>(qty);
  return (
    <span ref={ref} className="prod-img relative block size-full">
      {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="244px" className="object-contain" unoptimized /> : null}
    </span>
  );
}

/** Selos do canto: o desconto do nível em branco, o destaque do produto em preto e amarelo. */
function CardTags({ pctBp, tag }: Readonly<{ pctBp: number; tag?: ProductTag }>) {
  const tags: { text: string; tone: string }[] = [];
  if (pctBp > 0) tags.push({ text: `−${pctBp / 100}%`, tone: "bg-white text-expo-zinc" });
  if (tag) tags.push({ text: tag, tone: "bg-expo-noite text-brand-yellow" });
  if (tags.length === 0) return null;

  return (
    <span className="pointer-events-none absolute left-0 top-2 flex gap-1">
      {tags.map((item) => (
        <span key={item.text} className={`px-2 py-1 text-xs font-extrabold tracking-[0.48px] ${item.tone}`}>
          {item.text}
        </span>
      ))}
    </span>
  );
}

function CardControls({ product, qty, onChange }: Readonly<{ product: EventProduct; qty: number; onChange: (qty: number) => void }>) {
  const max = maxQty(product);
  const soldOut = max === 0;

  return (
    <div className="mt-auto flex flex-col gap-1.5 pt-1.5">
      {qty === 0 ? (
        <button
          type="button"
          aria-label={`Adicionar ${product.name}`}
          disabled={soldOut}
          onClick={() => onChange(1)}
          className="flex h-12 w-full items-center justify-center gap-2.5 bg-expo-noite text-white disabled:bg-expo-cinza disabled:text-expo-zinc"
        >
          {soldOut ? null : (
            <span aria-hidden className="text-[22px] font-bold leading-none">
              +
            </span>
          )}
          <span className="text-base font-extrabold">{soldOut ? "Sem estoque" : "Adicionar"}</span>
        </button>
      ) : (
        <Stepper productName={product.name} qty={qty} max={max} onChange={onChange} qtyId={product.id} />
      )}
      <QuickQty productName={product.name} qty={qty} max={max} onSet={onChange} />
    </div>
  );
}

/**
 * Card de produto em papel branco: foto que abre a ficha, preço do nível e os atalhos.
 * A altura é fixa para a prateleira não serrar, com a foto e o nome em caixas de
 * altura travada: nome de duas linhas não empurra o preço do card vizinho.
 */
export function ProductCard({ product, qty, pctBp, tag, shelf = false, onChange, onOpen }: Readonly<ProductCardProps>) {
  const price = discountedCents(product.priceCents, pctBp);

  return (
    <article
      aria-label={product.name}
      className={`relative flex h-[438px] flex-col gap-1.5 bg-white p-3 text-expo-ink ${shelf ? "w-[244px] flex-none snap-start pz:w-[220px]" : ""}`}
    >
      <div className="group relative flex h-46 w-full items-center justify-center bg-white">
        <Picture product={product} qty={qty} />
        <CardTags pctBp={pctBp} tag={tag} />
        <button type="button" onClick={onOpen} aria-label={`Ver detalhes de ${product.name}`} className="absolute inset-0" />
      </div>
      <h3 className="h-11">
        <button type="button" onClick={onOpen} className="line-clamp-2 text-left text-[18px] font-bold leading-[22px]">
          {product.name}
        </button>
      </h3>
      <p className="num h-4.5 text-[13px] font-semibold text-expo-mute line-through">
        {pctBp > 0 ? (
          <>
            <span className="sr-only">de </span>
            {formatCents(product.priceCents)}
          </>
        ) : null}
      </p>
      <p className="flex h-8 items-baseline gap-2">
        <span className="num whitespace-nowrap text-[26px] font-bold leading-8">
          {pctBp > 0 ? <span className="sr-only">por </span> : null}
          {formatCents(price)}
        </span>
        <span className="text-xs font-medium text-expo-zinc">por display</span>
      </p>
      <p className="line-clamp-1 text-[13px] font-medium text-expo-mute">{secondaryLine(product)}</p>
      <CardControls product={product} qty={qty} onChange={onChange} />
    </article>
  );
}
