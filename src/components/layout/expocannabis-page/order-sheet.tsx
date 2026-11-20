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
import { Paper } from "./paper";

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

function OrderLines({ context, preview, cart, sheet, onLineChange, onRemove, onKitsChange, onRemoveKit }: Readonly<OrderContentProps>) {
  const products = new Map(context.products.map((product) => [product.id, product]));
  const kitThumb = products.get(context.kit.productIds[context.kit.productIds.length - 1])?.imageUrl ?? "/images/expocannabis/kit-sedas-premium.png";

  if (preview.lines.length === 0 && cart.kits === 0) {
    return <p className="py-8 text-center text-[17px] font-semibold text-expo-mute">Seu pedido está vazio. Toque no + de um produto.</p>;
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
            compact={!sheet}
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
          compact={!sheet}
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

/** Totais no bloco escuro do rodapé: o que a prévia soma e o botão que leva aos dados. */
function OrderTotals({ preview, onCheckout, sheet }: Readonly<Pick<OrderContentProps, "preview" | "onCheckout" | "sheet">>) {
  const gift = preview.level.minUnits >= 10 ? "Bandeja chaveiro + merch" : "a partir de 10 un.";
  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: "Subtotal", value: formatCents(preview.itemsCents + preview.discountCents) },
    ...(preview.discountCents > 0
      ? [{ label: `Desconto do nível (${preview.level.pctBp / 100}%)`, value: `− ${formatCents(preview.discountCents)}`, strong: true }]
      : []),
    ...(preview.kit.totalCents > 0 ? [{ label: `Kit Premium ×${preview.kit.qty}`, value: formatCents(preview.kit.totalCents) }] : []),
    { label: "Brinde", value: gift },
  ];

  return (
    <div className={`flex flex-none flex-col bg-expo-noite text-white ${sheet ? "gap-2.5 px-6 py-6" : "gap-1 px-6 pb-4 pt-3"}`}>
      {rows.map((row) => (
        <p key={row.label} className={`flex justify-between gap-4 ${sheet ? "text-base font-medium" : "text-sm"} ${row.strong ? "font-extrabold" : ""}`}>
          <span>{row.label}</span>
          <span className="num text-right">{row.value}</span>
        </p>
      ))}
      <p className={`flex items-center justify-between ${sheet ? "min-h-14" : "min-h-12"}`}>
        <span className="text-base font-extrabold">Total</span>
        <span className={`num font-bold text-brand-yellow ${sheet ? "text-[36px]" : "text-[28px]"}`}>{formatCents(preview.itemsCents)}</span>
      </p>
      <button
        type="button"
        disabled={preview.units === 0}
        onClick={onCheckout}
        className={`flex items-center justify-center bg-brand-yellow text-[18px] font-extrabold text-expo-noite disabled:bg-expo-cinza disabled:text-expo-zinc ${
          sheet ? "min-h-16" : "min-h-15.5"
        }`}
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
      <div className="flex flex-none items-center justify-between px-6 pb-3.5 pt-5">
        <h2 id="expo-order-title" ref={titleRef} tabIndex={-1} className={`ultra outline-none ${sheet ? "text-[32px] leading-11" : "text-[28px] leading-9"}`}>
          Seu pedido
        </h2>
        {sheet ? (
          <button type="button" onClick={onClose} className="min-h-11 px-1 text-[15px] font-extrabold underline underline-offset-4">
            Fechar
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-4">
          <LevelCard levels={context.levels} units={preview.units} />
        </div>
        <div className={sheet ? "px-6 pt-3" : "px-5 pt-2"}>
          <OrderLines {...props} />
        </div>
        <div className={sheet ? "px-4 pb-3 pt-4.5" : "px-4 pb-2 pt-3"}>
          <KitCard kit={context.kit} units={preview.units} kits={cart.kits} onAdd={() => onKitsChange(Math.min(KIT_MAX, cart.kits + 1))} />
        </div>
      </div>
      {undo ? <div className="flex-none px-6 pb-2">{undo}</div> : null}
      <OrderTotals preview={preview} onCheckout={props.onCheckout} sheet={sheet} />
    </>
  );
}

/**
 * Pedido em papel claro: folha que sobe no retrato (com o fundo escurecido) e painel fixo
 * na paisagem. O papel recortado do handoff fica atrás do conteúdo, por isso a casca é
 * `relative` e tudo dentro dela também.
 */
export function OrderSheet(props: Readonly<OrderSheetProps>) {
  const { open, landscape, ...content } = props;
  const titleRef = useRef<HTMLHeadingElement>(null);

  if (landscape) {
    return (
      <aside aria-labelledby="expo-order-title" className="relative w-[440px] flex-none border-l border-expo-ink bg-white">
        <Paper src="/images/expocannabis/figma/papel-pedido-lateral.svg" />
        <div className="em-claro relative flex h-full flex-col text-expo-ink">
          <OrderContent {...content} sheet={false} />
        </div>
      </aside>
    );
  }

  return (
    <BaseModal
      open={open}
      onClose={content.onClose}
      initialFocusRef={titleRef}
      ariaLabelledBy="expo-order-title"
      containerClassName={`${EXPO_SCOPE_CLASS} items-end justify-center`}
      contentClassName="h-[88dvh] w-full max-w-[820px]"
      overlayClassName="bg-black/60"
    >
      <div className="expo-sobe relative h-full bg-white">
        <Paper src="/images/expocannabis/figma/papel-resumo-comercial.svg" />
        <div className="em-claro relative flex h-full flex-col text-expo-ink">
          <OrderContent {...content} sheet titleRef={titleRef} />
        </div>
      </div>
    </BaseModal>
  );
}
