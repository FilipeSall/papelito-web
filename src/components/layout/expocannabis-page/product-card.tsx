import Image from "next/image";

import type { EventProduct } from "@/features/expocannabis/types/context";
import { discountedCents, formatCents, maxQty } from "@/features/expocannabis/utils/cart";

import { QuickQty } from "./quick-qty";
import { Stepper } from "./stepper";

type ProductCardProps = {
  product: EventProduct;
  qty: number;
  pctBp: number;
  onChange: (qty: number) => void;
  onOpen: () => void;
};

function Price({ product, pctBp }: Readonly<{ product: EventProduct; pctBp: number }>) {
  const price = discountedCents(product.priceCents, pctBp);
  return (
    <p className="mt-1 flex items-baseline gap-2">
      <span className="text-lg font-extrabold">{formatCents(price)}</span>
      {pctBp > 0 ? <s className="text-sm text-[#52525B]">{formatCents(product.priceCents)}</s> : null}
    </p>
  );
}

function CardControls({ product, qty, onChange }: Readonly<{ product: EventProduct; qty: number; onChange: (qty: number) => void }>) {
  const max = maxQty(product);
  const quick = <QuickQty productName={product.name} qty={qty} max={max} onSet={onChange} />;
  if (qty === 0) {
    return (
      <div className="grid gap-2">
        <button
          type="button"
          aria-label={`Adicionar ${product.name}`}
          disabled={max === 0}
          onClick={() => onChange(1)}
          className="h-11 w-full rounded-md bg-brand-yellow text-base font-extrabold disabled:bg-[#E4E4E7] disabled:text-[#52525B]"
        >
          {max === 0 ? "Sem estoque" : "Adicionar"}
        </button>
        {quick}
      </div>
    );
  }
  return (
    <div className="expo-pop grid gap-2">
      <Stepper productName={product.name} qty={qty} max={max} onChange={onChange} qtyId={product.id} />
      {quick}
    </div>
  );
}

/** Card de produto da loja: imagem (abre o detalhe), preço com o nível, Adicionar ou contador e 5/10/20. */
export function ProductCard({ product, qty, pctBp, onChange, onOpen }: Readonly<ProductCardProps>) {
  return (
    <article className="flex flex-col rounded-lg border-2 border-[#E4E4E7] bg-white p-3">
      <button type="button" onClick={onOpen} aria-label={`Ver detalhes de ${product.name}`} className="relative h-[190px] overflow-hidden rounded-md bg-[#F4F4F5]">
        {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="200px" className="object-contain" unoptimized /> : null}
        {pctBp > 0 ? (
          <span className="absolute left-2 top-2 rounded-sm bg-brand-yellow px-2 py-0.5 text-xs font-extrabold">−{pctBp / 100}%</span>
        ) : null}
      </button>
      <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-tight">{product.name}</h3>
      {product.stock === 0 ? <p className="text-sm font-bold text-[#B42318]">Sem estoque</p> : null}
      <Price product={product} pctBp={pctBp} />
      <div className="mt-auto pt-3">
        <CardControls product={product} qty={qty} onChange={onChange} />
      </div>
    </article>
  );
}
