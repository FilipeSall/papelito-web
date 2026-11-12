"use client";

import { useRef, type ReactNode, type RefObject } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import { EXPO_SCOPE_CLASS } from "@/features/expocannabis/fonts";
import type { EventContext } from "@/features/expocannabis/types/context";
import type { Cart } from "@/features/expocannabis/utils/cart";
import { formatCents, maxQty } from "@/features/expocannabis/utils/cart";
import type { PricingPreview } from "@/features/expocannabis/utils/pricing-preview";

import { KitCard } from "./kit-card";
import { LevelCard } from "./level-card";
import { OrderLine } from "./order-line";

type OrderSheetProps = {
  open: boolean;
  landscape: boolean;
  context: EventContext;
  preview: PricingPreview;
  cart: Cart;
  undo: ReactNode;
  onClose: () => void;
  onLineChange: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
  onKitsChange: (kits: number) => void;
  onRemoveKit: () => void;
  onCheckout: () => void;
};

type OrderContentProps = Omit<OrderSheetProps, "open" | "landscape"> & { sheet: boolean; titleRef?: RefObject<HTMLHeadingElement | null> };

const KIT_MAX = 3;

function SummaryRow({ label, value, muted = false }: Readonly<{ label: string; value: string; muted?: boolean }>) {
  const weight = muted ? "font-semibold" : "font-bold";
  return (
    <div className={`flex justify-between text-sm ${weight}`}>
      <span className={muted ? "text-[#52525b]" : ""}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function OrderLines({ context, preview, cart, onLineChange, onRemove, onKitsChange, onRemoveKit }: Readonly<OrderContentProps>) {
  const products = new Map(context.products.map((product) => [product.id, product]));
  const kitThumb = products.get(context.kit.productIds[context.kit.productIds.length - 1])?.imageUrl ?? "/images/expocannabis/kit-sedas-premium.png";

  if (preview.lines.length === 0 && cart.kits === 0) {
    return <p className="py-6 text-[15px] font-semibold text-[#52525B]">Seu pedido está vazio. Toque no + de um produto.</p>;
  }

  return (
    <ul>
      {preview.lines.map((line) => {
        const product = products.get(line.productId);
        if (!product) return null;
        return (
          <OrderLine
            key={line.productId}
            name={product.name}
            imageUrl={product.imageUrl}
            qty={line.qty}
            unitCents={line.totalCents / line.qty}
            max={maxQty(product)}
            onChange={(qty) => onLineChange(product.id, qty)}
            onRemove={() => onRemove(product.id)}
          />
        );
      })}
      {cart.kits > 0 ? (
        <OrderLine
          name="Kit de Sedas Premium (4 displays)"
          imageUrl={kitThumb}
          qty={cart.kits}
          unitCents={context.kit.unitCents}
          max={KIT_MAX}
          minusLabel="Tirar 1 kit"
          plusLabel="Colocar 1 kit"
          removeLabel="Remover Kit de Sedas Premium do pedido"
          onChange={onKitsChange}
          onRemove={onRemoveKit}
        />
      ) : null}
    </ul>
  );
}

function OrderSummary({ preview, onCheckout }: Readonly<Pick<OrderContentProps, "preview" | "onCheckout">>) {
  const gift = preview.level.minUnits >= 10 ? "Bandeja chaveiro + merch" : "a partir de 10 un.";

  return (
    <div className="flex flex-none flex-col gap-1.5 border-t border-[#E4E4E7] px-6 pb-5 pt-3">
      <SummaryRow label="Subtotal" value={formatCents(preview.itemsCents + preview.discountCents)} muted />
      <SummaryRow label={`Desconto do nível (${preview.level.pctBp / 100}%)`} value={`− ${formatCents(preview.discountCents)}`} />
      <SummaryRow label="Brinde" value={gift} muted />
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-base font-extrabold">Total</span>
        <span className="text-2xl font-extrabold">{formatCents(preview.itemsCents)}</span>
      </div>
      <button
        type="button"
        disabled={preview.units === 0}
        onClick={onCheckout}
        className="mt-2 min-h-15 w-full rounded-lg bg-brand-yellow text-lg font-extrabold transition-transform duration-120 active:scale-95 disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#71717a] motion-reduce:transition-none"
      >
        Fechar pedido
      </button>
    </div>
  );
}

function OrderContent(props: Readonly<OrderContentProps>) {
  const { context, preview, cart, undo, sheet, titleRef, onClose, onKitsChange } = props;

  return (
    <>
      <div className="flex flex-none items-center justify-between px-6 pb-3 pt-5">
        <h2 id="expo-order-title" ref={titleRef} tabIndex={-1} className="text-[22px] font-extrabold outline-none">
          Seu pedido
        </h2>
        {sheet ? (
          <button type="button" onClick={onClose} className="min-h-11 px-1 text-[15px] font-bold underline underline-offset-3">
            Fechar
          </button>
        ) : null}
      </div>
      <LevelCard levels={context.levels} units={preview.units} />
      <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pt-1">
        <OrderLines {...props} />
        <div className="mb-2.5 mt-4.5">
          <KitCard kit={context.kit} units={preview.units} kits={cart.kits} onAdd={() => onKitsChange(Math.min(KIT_MAX, cart.kits + 1))} />
        </div>
      </div>
      {undo ? <div className="flex-none px-6 pt-2">{undo}</div> : null}
      <OrderSummary preview={preview} onCheckout={props.onCheckout} />
    </>
  );
}

/** Pedido: folha de 88% que sobe no retrato (com fundo escurecido) e painel fixo de 360 px na paisagem. */
export function OrderSheet(props: Readonly<OrderSheetProps>) {
  const { open, landscape, ...content } = props;
  const titleRef = useRef<HTMLHeadingElement>(null);

  if (landscape) {
    return (
      <aside aria-labelledby="expo-order-title" className="flex w-90 flex-none flex-col border-l border-[#E4E4E7] bg-white">
        <OrderContent {...content} sheet={false} />
      </aside>
    );
  }

  return (
    <BaseModal
      open={open}
      onClose={content.onClose}
      initialFocusRef={titleRef}
      ariaLabelledBy="expo-order-title"
      containerClassName={`${EXPO_SCOPE_CLASS} items-end`}
      contentClassName="h-[88dvh]"
      overlayClassName="bg-black/45 expo-dim"
    >
      <div className="expo-sheet flex h-full flex-col rounded-t-xl bg-white shadow-[0_-1px_0_#E4E4E7]">
        <OrderContent {...content} sheet titleRef={titleRef} />
      </div>
    </BaseModal>
  );
}
