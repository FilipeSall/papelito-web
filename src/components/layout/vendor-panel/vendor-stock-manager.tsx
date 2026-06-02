"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Panel } from "@/components/layout/operational-panel";
import type {
  VendorStockFilter,
  VendorStockItem,
  VendorStockSnapshot,
} from "@/features/vendor-stock/types/vendor-stock";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import { StockPagination } from "./stock-pagination";
import { StockRow } from "./stock-row";
import { StockToolbar } from "./stock-toolbar";

const tableHeaders = ["Produto", "Ultimo ajuste", "Status", "Quantidade"];

export function VendorStockManager({
  filter,
  focusProductId,
  search,
  snapshot,
}: {
  filter: VendorStockFilter;
  focusProductId?: number;
  search: string;
  snapshot: VendorStockSnapshot;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(snapshot.items.map((item) => [item.productId, String(item.qty)])),
  );
  const [savingIds, setSavingIds] = useState<Set<number>>(() => new Set());
  const [savingAll, setSavingAll] = useState(false);
  const focusedInPage = snapshot.items.some((item) => item.productId === focusProductId);
  const totalPages = Math.max(1, Math.ceil(snapshot.total / snapshot.perPage));
  const changedItems = snapshot.items.filter(
    (item) => (quantities[item.productId] ?? String(item.qty)) !== String(item.qty),
  );
  const hasInvalidChangedQty = changedItems.some((item) => {
    const nextQty = Number(quantities[item.productId] ?? "");

    return !Number.isInteger(nextQty) || nextQty < 0;
  });

  useEffect(() => {
    setQuantities(Object.fromEntries(snapshot.items.map((item) => [item.productId, String(item.qty)])));
  }, [snapshot.items]);

  function handleQtyChange(productId: number, qty: string) {
    setQuantities((current) => ({ ...current, [productId]: qty }));
  }

  async function persistStock(item: VendorStockItem) {
    const nextQty = Number(quantities[item.productId] ?? item.qty);
    if (!Number.isInteger(nextQty) || nextQty < 0) {
      throw new Error("Informe uma quantidade inteira maior ou igual a zero.");
    }

    const response = await fetch("/api/vendor/stock", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: item.productId, qty: nextQty }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      throw new Error(data?.message ?? "Nao foi possivel atualizar o estoque.");
    }

    return nextQty;
  }

  async function saveOne(item: VendorStockItem) {
    setSavingIds((current) => new Set(current).add(item.productId));
    try {
      const nextQty = await persistStock(item);
      setFeedback({
        error: false,
        message: nextQty === 0 ? "Estoque zerado. A notificacao foi registrada." : "Estoque atualizado.",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        error: true,
        message: error instanceof Error ? error.message : "Nao foi possivel atualizar o estoque.",
      });
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(item.productId);
        return next;
      });
    }
  }

  async function saveAll() {
    if (changedItems.length === 0) {
      return;
    }

    if (hasInvalidChangedQty) {
      setFeedback({ error: true, message: "Informe quantidades inteiras maiores ou iguais a zero." });
      return;
    }

    setSavingAll(true);
    setSavingIds(new Set(changedItems.map((item) => item.productId)));
    try {
      const results = await Promise.allSettled(changedItems.map((item) => persistStock(item)));
      const failures = results.filter((result) => result.status === "rejected");

      if (failures.length > 0) {
        setFeedback({
          error: true,
          message: `${failures.length} ajuste(s) nao foram salvos. Revise as linhas alteradas.`,
        });
        return;
      }

      setFeedback({
        error: false,
        message: `${changedItems.length} ajuste(s) de estoque salvos.`,
      });
      router.refresh();
    } finally {
      setSavingAll(false);
      setSavingIds(new Set());
    }
  }

  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden">
        <StockToolbar filter={filter} search={search} />
        <FeedbackBanner className="mx-5 mt-4" feedback={feedback} />
        {focusProductId && !focusedInPage ? (
          <p className="mx-5 mt-4 rounded-[12px] bg-brand-yellow/22 px-4 py-3 text-sm text-brand-dark">
            O produto indicado pela notificacao nao esta nesta pagina ou nao corresponde aos filtros atuais.
          </p>
        ) : null}
        {snapshot.items.length === 0 ? (
          <p className="px-5 py-10 text-sm text-brand-dark/64">Nenhum produto encontrado para este filtro.</p>
        ) : (
          <div className="overflow-x-auto px-2 pt-3">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      className="border-b border-brand-dark/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48 last:text-right"
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
                    save={saveOne}
                    saving={savingIds.has(item.productId)}
                  />
                ))}
              </tbody>
            </table>
            <div className="flex flex-col items-end gap-2 border-t border-brand-dark/12 px-4 py-5 sm:flex-row sm:justify-end">
              <p className="text-xs font-medium text-brand-dark/58">
                {changedItems.length === 0
                  ? "Nenhuma alteração pendente nesta página."
                  : `${changedItems.length} alteração(ões) pendente(s) nesta página.`}
              </p>
              <button
                className="h-11 rounded-[12px] bg-brand-yellow px-5 text-xs font-black uppercase tracking-[0.18em] text-brand-dark shadow-[4px_4px_0_rgba(35,31,32,0.14)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                disabled={savingAll || changedItems.length === 0 || hasInvalidChangedQty}
                onClick={() => void saveAll()}
                type="button"
              >
                {savingAll ? "Salvando todos" : "Salvar todos"}
              </button>
            </div>
          </div>
        )}
        <StockPagination
          filter={filter}
          page={snapshot.page}
          search={search}
          total={snapshot.total}
          totalPages={totalPages}
        />
      </Panel>
    </div>
  );
}
