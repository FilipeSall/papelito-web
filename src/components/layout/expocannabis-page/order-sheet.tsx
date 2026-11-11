"use client";

import { useSyncExternalStore } from "react";

import type { Cart } from "@/features/expocannabis/utils/cart";
import { formatCents, maxQty } from "@/features/expocannabis/utils/cart";
import type { EventContext } from "@/features/expocannabis/types/context";
import type { PricingPreview } from "@/features/expocannabis/utils/pricing-preview";

import { KitCard } from "./kit-card";
import { LevelBar } from "./level-bar";
import { OrderLine } from "./order-line";

type OrderSheetProps = {
  open: boolean;
  context: EventContext;
  preview: PricingPreview;
  cart: Cart;
  onClose: () => void;
  onLineChange: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
  onKitsChange: (kits: number) => void;
  onCheckout: () => void;
};

const SHEET_OPEN =
  "expo-sheet fixed inset-x-0 bottom-0 z-30 flex h-[88dvh] flex-col rounded-t-xl border-t-[3px] border-[#231F20] bg-white min-[1024px]:static min-[1024px]:h-auto min-[1024px]:w-[360px] min-[1024px]:rounded-none min-[1024px]:border-l-2 min-[1024px]:border-t-0";
const SHEET_PANEL = "hidden min-[1024px]:flex min-[1024px]:w-[360px] min-[1024px]:flex-col min-[1024px]:border-l-2 min-[1024px]:border-[#E4E4E7] bg-white";

function SummaryRow({ label, value, strong = false }: Readonly<{ label: string; value: string; strong?: boolean }>) {
  return (
    <div className={`flex justify-between ${strong ? "text-xl font-extrabold" : "text-base font-semibold"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function OrderLines({ context, preview, onLineChange, onRemove }: Readonly<Pick<OrderSheetProps, "context" | "preview" | "onLineChange" | "onRemove">>) {
  const products = new Map(context.products.map((product) => [product.id, product]));

  if (preview.lines.length === 0) {
    return <p className="py-6 text-base text-[#52525B]">Seu pedido está vazio. Toque no + de um produto.</p>;
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
    </ul>
  );
}

const LANDSCAPE = "(min-width: 1024px)";

function subscribeLandscape(onChange: () => void): () => void {
  const query = window.matchMedia(LANDSCAPE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isLandscape(): boolean {
  return window.matchMedia(LANDSCAPE).matches;
}

function serverLandscape(): boolean {
  return false;
}

/** Pedido: folha que sobe no retrato e painel fixo de 360 px na paisagem. */
export function OrderSheet(props: Readonly<OrderSheetProps>) {
  const { open, context, preview, cart, onClose, onKitsChange, onCheckout } = props;
  const landscape = useSyncExternalStore(subscribeLandscape, isLandscape, serverLandscape);

  if (!open && !landscape) return null;

  const gift = preview.level.minUnits >= 10 ? "Bandeja chaveiro + merch" : "a partir de 10 un.";

  return (
    <aside
      aria-labelledby="expo-order-title"
      role={open ? "dialog" : undefined}
      aria-modal={open ? true : undefined}
      className={open ? SHEET_OPEN : SHEET_PANEL}
    >
      <div className="flex items-center justify-between border-b-2 border-[#E4E4E7] px-6 py-4">
        <h2 id="expo-order-title" className="text-[21px] font-extrabold">
          Seu pedido
        </h2>
        {open ? (
          <button type="button" onClick={onClose} className="h-11 px-3 text-base font-bold min-[1024px]:hidden">
            Fechar
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <p className="text-base font-extrabold">{`Nível ${preview.level.name} · ${preview.level.pctBp / 100}% off em tudo`}</p>
        <div className="mt-2">
          <LevelBar levels={context.levels} units={preview.units} />
        </div>
        <OrderLines {...props} />
        <div className="mt-4">
          <KitCard kit={context.kit} units={preview.units} kits={cart.kits} onAdd={() => onKitsChange(cart.kits + 1)} />
          {cart.kits > 0 ? (
            <button type="button" onClick={() => onKitsChange(cart.kits - 1)} className="mt-2 h-11 w-full rounded-md border-2 border-[#231F20] text-sm font-bold">
              Tirar 1 kit
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2 border-t-2 border-[#E4E4E7] px-6 py-4">
        <SummaryRow label="Subtotal" value={formatCents(preview.itemsCents + preview.discountCents)} />
        <SummaryRow label={`Desconto do nível (${preview.level.pctBp / 100}%)`} value={`− ${formatCents(preview.discountCents)}`} />
        <SummaryRow label="Brinde" value={gift} />
        <SummaryRow label="Total" value={formatCents(preview.itemsCents)} strong />
        <button
          type="button"
          disabled={preview.units === 0}
          onClick={onCheckout}
          className="mt-2 h-[60px] rounded-md bg-brand-yellow text-lg font-extrabold shadow-[0_5px_0_#231F20] disabled:bg-[#E4E4E7] disabled:shadow-none"
        >
          Fechar pedido
        </button>
      </div>
    </aside>
  );
}
