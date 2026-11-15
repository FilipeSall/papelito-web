import Image from "next/image";

import type { ExpoPriceProduct } from "@/features/expocannabis/types/admin-prices";
import { formatCents } from "@/features/expocannabis/utils/cart";

import { FIELD_FOCUS_WITHIN } from "./expoday-field";

type ExpodayPriceRowProps = {
  product: ExpoPriceProduct;
  /** Texto do campo de preço do evento, como o admin digitou. */
  raw: string;
  /** Preço que o estande cobra com o rascunho. */
  standCents: number;
  /** O texto do campo não vira preço. */
  invalid: boolean;
  /** O preço do rascunho difere do publicado. */
  changed: boolean;
  /** Faz parte do Kit Premium. */
  inKit: boolean;
  /** Trava o campo enquanto uma publicação está em andamento. */
  disabled: boolean;
  onChange: (productId: number, raw: string) => void;
};

const CHIP = "inline-flex min-h-6 items-center border-2 px-2 text-[9.5px] font-black uppercase tracking-[0.14em]";

function StockChip({ stock }: Readonly<{ stock: number }>) {
  if (stock <= 0) return <span className={`${CHIP} border-[#c0392b] bg-[#c0392b] text-white`}>Sem estoque</span>;
  return <span className={`${CHIP} border-[#1a1a1a] bg-[#faf8f2]`}>{`${stock} na Cifal`}</span>;
}

function PriceDelta({ siteCents, standCents }: Readonly<{ siteCents: number; standCents: number }>) {
  if (standCents === siteCents) return <span className={`${CHIP} border-dashed border-[#1a1a1a]`}>Preço do site</span>;

  const pct = Math.round(((standCents - siteCents) / siteCents) * 1000) / 10;
  const label = `${pct > 0 ? "+" : ""}${pct.toLocaleString("pt-BR")}% sobre o site`;
  const tone = pct < 0 ? "text-[#1f6b3a]" : "text-[#c0392b]";

  return <span className={`text-xs font-bold tabular-nums ${tone}`}>{label}</span>;
}

function ProductThumb({ product }: Readonly<{ product: ExpoPriceProduct }>) {
  if (!product.imageUrl) {
    return <span aria-hidden className="size-12 shrink-0 border-2 border-[#1a1a1a] bg-[#f4f4f5]" />;
  }

  return (
    <Image
      alt=""
      className="size-12 shrink-0 border-2 border-[#1a1a1a] bg-[#f4f4f5] object-contain"
      height={48}
      src={product.imageUrl}
      width={48}
    />
  );
}

function rowBackground(changed: boolean, invalid: boolean): string {
  if (invalid) return "bg-[#fff1f0]";
  if (changed) return "bg-[#fffbd6]";
  return "bg-[#faf8f2] hover:bg-white";
}

/**
 * Linha de um produto na aba ExpoDay: preço do site, campo do preço do evento e a diferença. O
 * campo vazio usa o preço do site; a linha fica amarela enquanto o preço não foi publicado.
 */
export function ExpodayPriceRow({ changed, disabled, inKit, invalid, onChange, product, raw, standCents }: Readonly<ExpodayPriceRowProps>) {
  const inputId = `expoday-price-${product.id}`;
  const errorId = `${inputId}-error`;

  return (
    <li className={`grid gap-3 border-b-2 border-[#1a1a1a]/10 px-5 py-3 md:grid-cols-[minmax(0,1.6fr)_7rem_11rem_minmax(0,1fr)] md:items-center ${rowBackground(changed, invalid)}`}>
      <div className="flex min-w-0 items-center gap-3">
        <ProductThumb product={product} />
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-5">{product.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <StockChip stock={product.stock} />
            {inKit ? <span className={`${CHIP} border-[#1a1a1a] bg-brand-yellow`}>No Kit</span> : null}
          </div>
        </div>
      </div>
      <p className="text-sm tabular-nums">
        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#231f20]/64">Site</span>
        {formatCents(product.sitePriceCents)}
      </p>
      <div>
        <label className="sr-only" htmlFor={inputId}>{`Preço do evento de ${product.name}`}</label>
        <span
          className={[
            "flex h-11 items-center border-2",
            invalid ? "border-[#c0392b] bg-white" : "border-[#1a1a1a] bg-white",
            FIELD_FOCUS_WITHIN,
          ].join(" ")}
        >
          <span aria-hidden className="pl-3 text-sm text-[#231f20]/60">R$</span>
          <input
            aria-describedby={invalid ? errorId : undefined}
            aria-invalid={invalid || undefined}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-2 text-base font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-[#6b6b70] disabled:cursor-not-allowed disabled:text-[#52525b]"
            disabled={disabled}
            id={inputId}
            inputMode="decimal"
            onChange={(event) => onChange(product.id, event.target.value)}
            placeholder={formatCents(product.sitePriceCents).replace(/^R\$\s?/, "")}
            value={raw}
          />
        </span>
        {invalid ? (
          <p className="mt-1 text-xs font-bold text-[#c0392b]" id={errorId}>
            Use um valor como 89,90.
          </p>
        ) : null}
      </div>
      <PriceDelta siteCents={product.sitePriceCents} standCents={standCents} />
    </li>
  );
}
