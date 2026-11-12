"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type Dispatch } from "react";

import type { AttendanceAction, AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { EventContext, EventProduct } from "@/features/expocannabis/types/context";
import { applyCartRules, levelIndex, maxQty, normalizeSearch, type Cart } from "@/features/expocannabis/utils/cart";
import { previewPricing, unitsOf } from "@/features/expocannabis/utils/pricing-preview";
import {
  ALL,
  HOME,
  LAUNCHES,
  PREMIUM,
  buildProductTags,
  buildStoreCategories,
  gridProducts,
  gridTitle,
  pickProducts,
  productCountText,
  type ProductTag,
} from "@/features/expocannabis/utils/store-catalog";

import { CategoryChips } from "./category-chips";
import { LevelToast } from "./level-toast";
import { OrderBar } from "./order-bar";
import { OrderSheet } from "./order-sheet";
import { ProductCard } from "./product-card";
import { ProductGrid } from "./product-grid";
import { ProductSheet } from "./product-sheet";
import { PromoBanner } from "./promo-banner";
import { ShelfRow } from "./shelf-row";
import { UndoBar } from "./undo-bar";
import { useLandscape } from "./use-landscape";

type StoreScreenProps = {
  context: EventContext;
  state: AttendanceState;
  dispatch: Dispatch<AttendanceAction>;
  onCheckout: () => void;
};

type Undo = { text: string; cart: Cart };

const UNDO_MS = 5000;
const KIT_REMOVED_TEXT = "O Kit Premium saiu: ele precisa de 10 unidades no pedido.";
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

type CatalogProps = {
  context: EventContext;
  byId: Map<number, EventProduct>;
  state: AttendanceState;
  tags: Map<number, ProductTag>;
  category: string;
  search: string;
  pctBp: number;
  onCategory: (key: string) => void;
  onQty: (product: EventProduct, qty: number) => void;
  onOpen: (product: EventProduct) => void;
};

function StockAlert({ state, byId }: Readonly<{ state: AttendanceState; byId: Map<number, EventProduct> }>) {
  if (state.stockIssues.length === 0) return null;
  const names = state.stockIssues.map((issue) => `${byId.get(issue.productId)?.name ?? "Produto"} (tem ${issue.available})`).join(", ");

  return (
    <p role="alert" className="rounded-md border-2 border-[#B42318] bg-[#FFF1F0] p-3 text-base font-bold text-[#B42318]">
      {`Faltou estoque: ${names}. Ajuste o pedido e feche de novo.`}
    </p>
  );
}

function Catalog({ context, byId, state, tags, category, search, pctBp, onCategory, onQty, onOpen }: Readonly<CatalogProps>) {
  const categories = useMemo(() => buildStoreCategories(context), [context]);
  const showHome = category === HOME && normalizeSearch(search) === "";
  const card = (product: EventProduct, shelf: boolean) => (
    <ProductCard
      key={product.id}
      product={product}
      qty={state.qty[product.id] ?? 0}
      pctBp={pctBp}
      tag={tags.get(product.id)}
      shelf={shelf}
      onChange={(qty) => onQty(product, qty)}
      onOpen={() => onOpen(product)}
    />
  );
  const shelves = [
    { title: "Mais vendidos", ids: context.shelves.maisVendidos, target: ALL },
    { title: "Linha Premium", ids: context.kit.productIds, target: PREMIUM },
    { title: "Lançamentos", ids: context.shelves.lancamentos, target: LAUNCHES },
  ];
  const grid = showHome ? [] : gridProducts(context, byId, category, search);
  const active = normalizeSearch(search) === "" ? category : "";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-6.5 overflow-y-auto px-6 pb-7 pt-1">
      <StockAlert state={state} byId={byId} />
      {showHome ? <PromoBanner /> : null}
      <CategoryChips categories={categories} active={active} onSelect={onCategory} />
      {showHome
        ? shelves.map((shelf) => (
            <ShelfRow key={shelf.title} title={shelf.title} onSeeAll={() => onCategory(shelf.target)}>
              {pickProducts(byId, shelf.ids).map((product) => card(product, true))}
            </ShelfRow>
          ))
        : null}
      {showHome ? null : (
        <ProductGrid key={category} title={gridTitle(categories, category, search)} count={productCountText(grid.length)} empty={grid.length === 0}>
          {grid.map((product) => card(product, false))}
        </ProductGrid>
      )}
    </div>
  );
}

function SearchField({ value, onChange }: Readonly<{ value: string; onChange: (value: string) => void }>) {
  return (
    <div className="relative flex-none px-6 pb-3 pt-4">
      <Search aria-hidden size={20} strokeWidth={2.2} className="absolute left-10.5 top-7.5 text-[#52525b]" />
      <label htmlFor="expo-search" className="sr-only">
        Buscar produtos
      </label>
      <input
        id="expo-search"
        type="search"
        placeholder="Buscar sedas, piteiras, filtros…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12.5 w-full rounded-lg border-0 bg-[#F4F4F5] pl-11.5 pr-4 text-base font-medium"
      />
    </div>
  );
}

/**
 * Tela 02: loja com busca fixa, categorias, vitrines, níveis, Kit Premium e o pedido.
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
  const landscape = useLandscape();
  const byId = useMemo(() => new Map(context.products.map((product) => [product.id, product])), [context.products]);
  const tags = useMemo(() => buildProductTags(context), [context]);
  const preview = previewPricing(context, state.qty, state.kits);

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

  const undoBar = undo ? <UndoBar text={undo.text} onUndo={restore} /> : null;
  const showMainUndo = !landscape && !orderOpen && undoBar !== null;
  const showToast = toast > 0 && !orderOpen && !detail;

  return (
    <div className="flex h-full">
      <div aria-hidden={orderOpen || undefined} className="relative flex min-w-0 flex-1 flex-col">
        <SearchField value={search} onChange={setSearch} />
        <Catalog
          context={context}
          byId={byId}
          state={state}
          tags={tags}
          category={category}
          search={search}
          pctBp={preview.level.pctBp}
          onCategory={(key) => {
            setCategory(key);
            setSearch("");
          }}
          onQty={setQty}
          onOpen={setDetail}
        />
        {showMainUndo ? <div className="flex-none px-6 pb-2.5">{undoBar}</div> : null}
        <OrderBar levels={context.levels} units={preview.units} totalCents={preview.itemsCents} onOpen={() => setOrderOpen(true)} />
        {showToast ? <LevelToast levelIndex={toast} lead={state.lead} onLead={() => dispatch({ type: "set-lead" })} onClose={closeToast} /> : null}
      </div>
      <OrderSheet
        open={orderOpen}
        landscape={landscape}
        context={context}
        preview={preview}
        cart={{ qty: state.qty, kits: state.kits }}
        undo={undoBar}
        onClose={() => setOrderOpen(false)}
        onLineChange={(productId, qty) => {
          const product = byId.get(productId);
          if (product) setQty(product, qty);
        }}
        onRemove={removeLine}
        onKitsChange={(kits) => changeCart({ qty: state.qty, kits: Math.max(0, Math.min(3, kits)) })}
        onRemoveKit={() => changeCart({ qty: state.qty, kits: 0 }, "Kit de Sedas Premium")}
        onCheckout={onCheckout}
      />
      <ProductSheet
        product={detail}
        qty={detail ? (state.qty[detail.id] ?? 0) : 0}
        pctBp={preview.level.pctBp}
        onChange={(qty) => detail && setQty(detail, qty)}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
