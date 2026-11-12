import Image from "next/image";

import type { EventProduct } from "@/features/expocannabis/types/context";
import { discountedCents, formatCents, maxQty } from "@/features/expocannabis/utils/cart";
import { secondaryLine, type ProductTag } from "@/features/expocannabis/utils/store-catalog";

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

const TOUCH = "transition-transform duration-120 active:scale-95 motion-reduce:transition-none";
const TAG_BASE = "pointer-events-none absolute left-2 top-2 rounded-sm px-1.75 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]";

function Price({ product, pctBp }: Readonly<{ product: EventProduct; pctBp: number }>) {
  const price = discountedCents(product.priceCents, pctBp);
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="text-[17px] font-extrabold">{formatCents(price)}</span>
      {pctBp > 0 ? <s className="text-[13px] font-semibold text-[#52525b]">{formatCents(product.priceCents)}</s> : null}
    </p>
  );
}

function CardTag({ pctBp, tag }: Readonly<{ pctBp: number; tag?: ProductTag }>) {
  if (pctBp > 0) return <span className={`${TAG_BASE} bg-brand-yellow text-[#231F20]`}>{`−${pctBp / 100}%`}</span>;
  if (tag) return <span className={`${TAG_BASE} bg-[#231F20] text-white`}>{tag}</span>;
  return null;
}

function AddButton({ product, max, onChange }: Readonly<{ product: EventProduct; max: number; onChange: (qty: number) => void }>) {
  const soldOut = max === 0;
  return (
    <button
      type="button"
      aria-label={`Adicionar ${product.name}`}
      disabled={soldOut}
      onClick={() => onChange(1)}
      className={`mt-1 flex h-11.5 w-full items-center justify-center gap-1.5 rounded-md bg-brand-yellow text-base font-extrabold leading-none disabled:bg-[#E4E4E7] disabled:text-[#52525B] ${TOUCH}`}
    >
      {soldOut ? null : <b className="text-[22px] font-bold">+</b>}
      {soldOut ? "Sem estoque" : "Adicionar"}
    </button>
  );
}

function CardControls({ product, qty, onChange }: Readonly<{ product: EventProduct; qty: number; onChange: (qty: number) => void }>) {
  const max = maxQty(product);
  return (
    <>
      {qty === 0 ? (
        <AddButton product={product} max={max} onChange={onChange} />
      ) : (
        <Stepper productName={product.name} qty={qty} max={max} onChange={onChange} qtyId={product.id} />
      )}
      <QuickQty productName={product.name} qty={qty} max={max} onSet={onChange} />
    </>
  );
}

/** Card de produto: imagem que abre o detalhe, textos soltos, preço com o nível, Adicionar ou contador e 5/10/20. */
export function ProductCard({ product, qty, pctBp, tag, shelf = false, onChange, onOpen }: Readonly<ProductCardProps>) {
  const box = shelf ? "h-57.5" : "h-47.5";
  const picture = shelf ? "h-50 w-49" : "size-40";

  return (
    <article className={`flex min-w-0 flex-col gap-1.5 ${shelf ? "w-51.5 flex-none" : ""}`}>
      <div className={`relative flex items-center justify-center rounded-lg bg-[#F4F4F5] ${box}`}>
        <button type="button" onClick={onOpen} aria-label={`Ver detalhes de ${product.name}`} className="peer absolute inset-0 rounded-lg" />
        <span className={`pointer-events-none relative transition-transform duration-150 peer-active:scale-96 motion-reduce:transition-none ${picture}`}>
          {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="200px" className="object-contain" unoptimized /> : null}
        </span>
        <CardTag pctBp={pctBp} tag={tag} />
      </div>
      <h3 className="line-clamp-2 text-[15px] font-bold leading-tight">{product.name}</h3>
      <p className="text-[13px] font-medium text-[#52525b]">{secondaryLine(product)}</p>
      <Price product={product} pctBp={pctBp} />
      <CardControls product={product} qty={qty} onChange={onChange} />
    </article>
  );
}
