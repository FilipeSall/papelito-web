"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch } from "react";

import type { AttendanceAction, AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { EventContext, EventProduct } from "@/features/expocannabis/types/context";
import {
  applyCartRules,
  formatCents,
  levelIndex,
  maxQty,
  normalizeSearch,
  type Cart,
} from "@/features/expocannabis/utils/cart";
import { previewPricing, unitsOf } from "@/features/expocannabis/utils/pricing-preview";

import { CategoryChips, type StoreCategory } from "./category-chips";
import { LevelBar } from "./level-bar";
import { LevelToast } from "./level-toast";
import { OrderSheet } from "./order-sheet";
import { ProductCard } from "./product-card";
import { ProductSheet } from "./product-sheet";
import { UndoBar } from "./undo-bar";

type StoreScreenProps = {
  context: EventContext;
  state: AttendanceState;
  dispatch: Dispatch<AttendanceAction>;
  onCheckout: () => void;
};

type Undo = { text: string; cart: Cart };

const UNDO_MS = 5000;
const KIT_REMOVED_TEXT = "O Kit Premium saiu: ele precisa de 10 unidades no pedido.";
const HOME = "inicio";

function storeCategories(context: EventContext): StoreCategory[] {
  return [
    { key: HOME, label: "Início" },
    { key: "premium", label: "Premium" },
    { key: "lancamentos", label: "Lançamentos" },
    ...context.categories.map((category) => ({ key: `cat:${category.slug}`, label: category.name })),
  ];
}

function pick(products: Map<number, EventProduct>, ids: number[]): EventProduct[] {
  return ids.map((id) => products.get(id)).filter((product): product is EventProduct => product !== undefined);
}

function gridProducts(context: EventContext, byId: Map<number, EventProduct>, category: string, search: string): EventProduct[] {
  const term = normalizeSearch(search);
  if (term) return context.products.filter((product) => normalizeSearch(product.name).includes(term));
  if (category === "premium") return pick(byId, context.kit.productIds);
  if (category === "lancamentos") return pick(byId, context.shelves.lancamentos);
  return context.products.filter((product) => `cat:${product.category.slug}` === category);
}

function removalText(name: string, kitRemoved: boolean): string {
  return kitRemoved ? `${name} saiu do pedido (e o Kit Premium, que precisa de 10 un.).` : `${name} saiu do pedido.`;
}

function withQty(qty: Record<number, number>, productId: number, value: number): Record<number, number> {
  const next = { ...qty };
  if (value <= 0) {
    delete next[productId];
  } else {
    next[productId] = value;
  }
  return next;
}

/**
 * Tela 02: loja com categorias, busca, vitrines, níveis, Kit Premium e o pedido.
 *
 * O preço mostrado é a prévia; o valor cobrado sai da cotação na tela 03.
 */
export function StoreScreen({ context, state, dispatch, onCheckout }: Readonly<StoreScreenProps>) {
  const [category, setCategory] = useState(HOME);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<EventProduct | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [toast, setToast] = useState(0);
  const byId = useMemo(() => new Map(context.products.map((product) => [product.id, product])), [context.products]);
  const preview = previewPricing(context, state.qty, state.kits);
  const pct = preview.level.pctBp;

  useEffect(() => {
    if (!undo) return undefined;
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undo]);

  const closeToast = useCallback(() => setToast(0), []);

  const changeCart = (next: Cart, removedName?: string) => {
    const previous = { qty: state.qty, kits: state.kits };
    const { cart, kitRemoved } = applyCartRules(next);
    dispatch({ type: "set-cart", qty: cart.qty, kits: cart.kits });

    if (removedName) setUndo({ text: removalText(removedName, kitRemoved), cart: previous });
    else if (kitRemoved) setUndo({ text: KIT_REMOVED_TEXT, cart: previous });

    const index = levelIndex(context.levels, unitsOf(cart.qty, cart.kits));
    if (index > state.maxLevelIndex) {
      setToast(index);
      dispatch({ type: "level-reached", index });
    }
  };

  const setQty = (product: EventProduct, qty: number) => {
    const clamped = Math.min(maxQty(product), Math.max(0, qty));
    changeCart({ qty: withQty(state.qty, product.id, clamped), kits: state.kits });
  };

  const removeLine = (productId: number) => {
    const product = byId.get(productId);
    changeCart({ qty: withQty(state.qty, productId, 0), kits: state.kits }, product?.name ?? "Produto");
  };

  const restore = () => {
    if (!undo) return;
    dispatch({ type: "set-cart", qty: undo.cart.qty, kits: undo.cart.kits });
    setUndo(null);
  };

  const card = (product: EventProduct) => (
    <ProductCard
      key={product.id}
      product={product}
      qty={state.qty[product.id] ?? 0}
      pctBp={pct}
      onChange={(qty) => setQty(product, qty)}
      onOpen={() => setDetail(product)}
    />
  );

  const shelves = [
    { title: "Mais vendidos", ids: context.shelves.maisVendidos },
    { title: "Linha Premium", ids: context.kit.productIds },
    { title: "Lançamentos", ids: context.shelves.lancamentos },
  ];
  const showHome = category === HOME && normalizeSearch(search) === "";
  const grid = showHome ? [] : gridProducts(context, byId, category, search);

  return (
    <div className="flex h-full">
      <div aria-hidden={orderOpen || undefined} className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <label htmlFor="expo-search" className="sr-only">
            Buscar produtos
          </label>
          <input
            id="expo-search"
            type="search"
            placeholder="Buscar produtos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-14 w-full rounded-md border-2 border-[#D4D4D8] px-4 text-lg font-semibold"
          />
          <div className="mt-4 flex items-center gap-4 rounded-lg bg-brand-yellow p-4">
            <p className="font-[family-name:var(--font-expo-display)] text-[34px] uppercase leading-none">Desconto Progressivo</p>
            <p className="text-base font-bold">Garanta até 12% de desconto</p>
          </div>
          <div className="mt-4">
            <CategoryChips categories={storeCategories(context)} active={category} onSelect={setCategory} />
          </div>
          {showHome
            ? shelves.map((shelf) => (
                <section key={shelf.title} className="mt-6">
                  <h2 className="text-[21px] font-extrabold">{shelf.title}</h2>
                  <div className="mt-3 grid grid-cols-2 gap-3 min-[768px]:grid-cols-4">{pick(byId, shelf.ids).map(card)}</div>
                </section>
              ))
            : null}
          {showHome ? null : (
            <section key={`${category}:${search}`} className="expo-rise mt-6">
              {grid.length === 0 ? <p className="text-base text-[#52525B]">Nada encontrado. Tenta outro nome?</p> : null}
              <div className="grid grid-cols-2 gap-3 min-[768px]:grid-cols-4">{grid.map(card)}</div>
            </section>
          )}
        </div>
        <div className="border-t-2 border-[#E4E4E7] px-6 py-3 min-[1024px]:hidden">
          <LevelBar levels={context.levels} units={preview.units} />
          <button
            type="button"
            disabled={preview.units === 0}
            onClick={() => setOrderOpen(true)}
            className="mt-2 flex h-[60px] w-full items-center justify-between rounded-md bg-[#231F20] px-5 text-lg font-extrabold text-brand-yellow disabled:bg-[#E4E4E7] disabled:text-[#52525B]"
          >
            <span>{`Ver pedido · ${preview.units} ${preview.units === 1 ? "unidade" : "unidades"}`}</span>
            <span>{formatCents(preview.itemsCents)}</span>
          </button>
        </div>
      </div>
      <OrderSheet
        open={orderOpen}
        context={context}
        preview={preview}
        cart={{ qty: state.qty, kits: state.kits }}
        onClose={() => setOrderOpen(false)}
        onLineChange={(productId, qty) => {
          const product = byId.get(productId);
          if (product) setQty(product, qty);
        }}
        onRemove={removeLine}
        onKitsChange={(kits) => changeCart({ qty: state.qty, kits: Math.max(0, Math.min(3, kits)) })}
        onCheckout={onCheckout}
      />
      {undo ? (
        <div className="fixed inset-x-6 bottom-28 z-40 mx-auto max-w-[640px]">
          <UndoBar text={undo.text} onUndo={restore} />
        </div>
      ) : null}
      {toast > 0 && !orderOpen && !detail ? (
        <LevelToast levelIndex={toast} lead={state.lead} onLead={() => dispatch({ type: "set-lead" })} onClose={closeToast} />
      ) : null}
      <ProductSheet
        product={detail}
        qty={detail ? (state.qty[detail.id] ?? 0) : 0}
        pctBp={pct}
        onChange={(qty) => detail && setQty(detail, qty)}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
