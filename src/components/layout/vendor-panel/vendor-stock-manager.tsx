"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Panel } from "@/components/layout/operational-panel";
import type {
  VendorStockFilters,
  VendorStockSnapshot,
  VendorStockTaxonomies,
} from "@/features/vendor-stock/types/vendor-stock";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import { StockPagination } from "./stock-pagination";
import { StockRow } from "./stock-row";
import { StockToolbar } from "./stock-toolbar";

const tableHeaders = ["Produto", "Último ajuste", "Status", "Quantidade"];

export function VendorStockManager({
  filters,
  focusProductId,
  snapshot,
  taxonomies,
}: {
  filters: VendorStockFilters;
  focusProductId?: number;
  snapshot: VendorStockSnapshot;
  taxonomies: VendorStockTaxonomies;
}) {
  const router = useRouter();
  const AUTOSAVE_DELAY = 800;
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(snapshot.items.map((item) => [item.productId, String(item.qty)])),
  );
  const [savingIds, setSavingIds] = useState<Set<number>>(() => new Set());
  const focusedInPage = snapshot.items.some((item) => item.productId === focusProductId);
  const totalPages = Math.max(1, Math.ceil(snapshot.total / snapshot.perPage));

  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const savedQty = useRef<Map<number, number>>(
    new Map(snapshot.items.map((item) => [item.productId, item.qty])),
  );

  useEffect(() => {
    setQuantities(Object.fromEntries(snapshot.items.map((item) => [item.productId, String(item.qty)])));
    savedQty.current = new Map(snapshot.items.map((item) => [item.productId, item.qty]));
  }, [snapshot.items]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  async function persistStock(productId: number, nextQty: number) {
    setSavingIds((current) => new Set(current).add(productId));
    try {
      const response = await fetch("/api/vendor/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, qty: nextQty }),
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "Não foi possível atualizar o estoque.");
      }

      savedQty.current.set(productId, nextQty);
      setFeedback({
        error: false,
        message: nextQty === 0 ? "Estoque zerado. A notificação foi registrada." : "Estoque atualizado.",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        error: true,
        message: error instanceof Error ? error.message : "Não foi possível atualizar o estoque.",
      });
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(productId);
        return next;
      });
    }
  }

  function handleQtyChange(productId: number, qty: string) {
    setQuantities((current) => ({ ...current, [productId]: qty }));

    const existing = timers.current.get(productId);
    if (existing) clearTimeout(existing);

    const nextQty = Number(qty);
    if (qty.trim() === "" || !Number.isInteger(nextQty) || nextQty < 0) {
      return;
    }
    if (savedQty.current.get(productId) === nextQty) {
      return;
    }

    const timer = setTimeout(() => {
      timers.current.delete(productId);
      void persistStock(productId, nextQty);
    }, AUTOSAVE_DELAY);
    timers.current.set(productId, timer);
  }

  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden rounded-none border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <StockToolbar filters={filters} taxonomies={taxonomies} />
        <FeedbackBanner className="mx-5 mt-4" feedback={feedback} />
        {focusProductId && !focusedInPage ? (
          <p className="mx-5 mt-4 border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm font-medium text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
            O produto indicado pela notificação não esta nesta página ou não corresponde aos filtros atuais.
          </p>
        ) : null}
        {snapshot.items.length === 0 ? (
          <div className="px-5 py-10">
            <div className="border-2 border-dashed border-[#1a1a1a] bg-white px-5 py-8 text-center text-sm font-medium text-[#1a1a1a]/72">
              Nenhum produto encontrado para este filtro.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto px-2 pt-3">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      className="border-b border-brand-dark/20 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/58 last:text-right"
                      key={header}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshot.items.map((item) => (
                  <StockRow
                    focused={item.productId === focusProductId}
                    item={item}
                    key={item.productId}
                    onQtyChange={handleQtyChange}
                    qty={quantities[item.productId] ?? String(item.qty)}
                    saving={savingIds.has(item.productId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <StockPagination
          filters={filters}
          page={snapshot.page}
          total={snapshot.total}
          totalPages={totalPages}
        />
      </Panel>
    </div>
  );
}
