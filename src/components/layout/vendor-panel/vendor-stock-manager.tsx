"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Panel } from "@/components/layout/operational-panel";
import type {
  VendorStockFilters,
  VendorStockItem,
  VendorStockSnapshot,
  VendorStockSummary,
  VendorStockTaxonomies,
} from "@/features/vendor-stock/types/vendor-stock";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import { KitStockRow } from "./kit-stock-row";
import { StockActiveFilters } from "./stock-active-filters";
import { StockDataRequestModal } from "./stock-data-request-modal";
import { StockPagination } from "./stock-pagination";
import { StockRow } from "./stock-row";
import { StockSelectCell } from "./stock-cells";
import { StockSelectionBar } from "./stock-selection-bar";
import { StockSummary } from "./stock-summary";
import { StockToolbar } from "./stock-toolbar";

const AUTOSAVE_DELAY = 800;
const SAVED_BADGE_DELAY = 2400;

const tableHeaders = ["Produto", "Situação", "Última atualização", "Quantidade"];

export function VendorStockManager({
  contactPhone,
  filters,
  focusProductId,
  snapshot,
  summary,
  taxonomies,
}: {
  contactPhone: string;
  filters: VendorStockFilters;
  focusProductId?: number;
  snapshot: VendorStockSnapshot;
  summary: VendorStockSummary;
  taxonomies: VendorStockTaxonomies;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(snapshot.items.map((item) => [item.productId, String(item.qty)])),
  );
  const [savingIds, setSavingIds] = useState<Set<number>>(() => new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [requestedIds, setRequestedIds] = useState<Set<number>>(() => new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [requestItem, setRequestItem] = useState<VendorStockItem | null>(null);

  const focusedInPage = snapshot.items.some((item) => item.productId === focusProductId);
  const totalPages = Math.max(1, Math.ceil(snapshot.total / snapshot.perPage));

  // Kit não tem saldo próprio: selecionar um kit para "definir estoque" prometeria uma escrita
  // que o domínio não aceita. Só produto entra na seleção.
  const selectableIds = useMemo(
    () => snapshot.items.filter((item) => !item.kit).map((item) => item.productId),
    [snapshot.items],
  );

  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const savedTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const requestControllers = useRef<Map<number, AbortController>>(new Map());
  const requestVersions = useRef<Map<number, number>>(new Map());
  const savedQty = useRef<Map<number, number>>(
    new Map(snapshot.items.map((item) => [item.productId, item.qty])),
  );

  useEffect(() => {
    setQuantities(
      Object.fromEntries(snapshot.items.map((item) => [item.productId, String(item.qty)])),
    );
    savedQty.current = new Map(snapshot.items.map((item) => [item.productId, item.qty]));
  }, [snapshot.items]);

  // A seleção é da página: paginar ou filtrar troca o conjunto visível, e aplicar saldo a itens
  // que o vendor não vê mais seria uma escrita às cegas.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [snapshot.page, filters]);

  useEffect(() => {
    const pending = timers.current;
    const pendingSaved = savedTimers.current;
    const pendingRequests = requestControllers.current;

    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
      pendingSaved.forEach((timer) => clearTimeout(timer));
      pendingSaved.clear();
      pendingRequests.forEach((controller) => controller.abort());
      pendingRequests.clear();
    };
  }, []);

  function markSaved(productIds: number[]) {
    setSavedIds((current) => {
      const next = new Set(current);
      productIds.forEach((productId) => next.add(productId));
      return next;
    });

    productIds.forEach((productId) => {
      const existing = savedTimers.current.get(productId);
      if (existing) clearTimeout(existing);

      savedTimers.current.set(
        productId,
        setTimeout(() => {
          savedTimers.current.delete(productId);
          setSavedIds((current) => {
            const next = new Set(current);
            next.delete(productId);
            return next;
          });
        }, SAVED_BADGE_DELAY),
      );
    });
  }

  function bumpRequestVersion(productId: number) {
    const nextVersion = (requestVersions.current.get(productId) ?? 0) + 1;
    requestVersions.current.set(productId, nextVersion);
    return nextVersion;
  }

  function abortPendingRequest(productId: number) {
    const controller = requestControllers.current.get(productId);
    if (!controller) return;
    controller.abort();
    requestControllers.current.delete(productId);
  }

  function clearSaving(productId: number) {
    setSavingIds((current) => {
      if (!current.has(productId)) return current;
      const next = new Set(current);
      next.delete(productId);
      return next;
    });
  }

  async function persistStock(productId: number, nextQty: number, version: number) {
    const controller = new AbortController();
    requestControllers.current.set(productId, controller);
    setSavingIds((current) => new Set(current).add(productId));

    try {
      const response = await fetch("/api/vendor/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, qty: nextQty }),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "Não foi possível atualizar o estoque.");
      }

      if (requestVersions.current.get(productId) !== version) {
        return;
      }

      savedQty.current.set(productId, nextQty);
      markSaved([productId]);
      setFeedback({
        error: false,
        message:
          nextQty === 0 ? "Estoque zerado. A notificação foi registrada." : "Estoque atualizado.",
      });
      router.refresh();
    } catch (error) {
      if (requestVersions.current.get(productId) !== version) {
        return;
      }
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setFeedback({
        error: true,
        message:
          error instanceof Error ? error.message : "Não foi possível atualizar o estoque.",
      });
    } finally {
      if (requestControllers.current.get(productId) === controller) {
        requestControllers.current.delete(productId);
      }
      if (requestVersions.current.get(productId) !== version) {
        return;
      }
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

    abortPendingRequest(productId);
    const version = bumpRequestVersion(productId);
    const nextQty = Number(qty);
    if (qty.trim() === "" || !Number.isInteger(nextQty) || nextQty < 0) {
      clearSaving(productId);
      return;
    }
    if (savedQty.current.get(productId) === nextQty) {
      return;
    }

    const timer = setTimeout(() => {
      timers.current.delete(productId);
      void persistStock(productId, nextQty, version);
    }, AUTOSAVE_DELAY);
    timers.current.set(productId, timer);
  }

  async function applyBulkQty(qty: number) {
    const productIds = [...selectedIds];

    if (productIds.length === 0) {
      return;
    }

    const requestVersionsByProduct = new Map<number, number>();
    productIds.forEach((productId) => {
      const timer = timers.current.get(productId);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(productId);
      }
      abortPendingRequest(productId);
      requestVersionsByProduct.set(productId, bumpRequestVersion(productId));
    });

    setBulkSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/vendor/stock/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: productIds, qty }),
      });
      const data = (await response.json().catch(() => null)) as
        | { failed?: Array<{ message?: string; product_id?: number }>; message?: string; updated?: number }
        | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "Não foi possível aplicar o estoque em lote.");
      }

      const updated = Number(data?.updated) || 0;
      const failed = Array.isArray(data?.failed) ? data.failed : [];
      const failedIds = new Set(failed.map((entry) => Number(entry.product_id)));
      const successfulIds = productIds.filter(
        (productId) =>
          !failedIds.has(productId) &&
          requestVersions.current.get(productId) === requestVersionsByProduct.get(productId),
      );

      setQuantities((current) => {
        const next = { ...current };

        successfulIds.forEach((productId) => {
          next[productId] = String(qty);
        });

        return next;
      });

      successfulIds.forEach((productId) => savedQty.current.set(productId, qty));
      markSaved(successfulIds);
      setSelectedIds(new Set());
      setFeedback({
        details: failed.map(
          (entry) => `Produto ${entry.product_id}: ${entry.message ?? "falha ao gravar"}`,
        ),
        error: failed.length > 0,
        message:
          failed.length > 0
            ? `${updated} de ${productIds.length} atualizados. ${failed.length} falharam.`
            : `Estoque ${qty} aplicado a ${updated} ${updated === 1 ? "produto" : "produtos"}.`,
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        error: true,
        message:
          error instanceof Error ? error.message : "Não foi possível aplicar o estoque em lote.",
      });
    } finally {
      setBulkSaving(false);
    }
  }

  function toggleItem(productId: number, selected: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (selected) {
        next.add(productId);
      } else {
        next.delete(productId);
      }

      return next;
    });
  }

  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  return (
    <div className="space-y-4 md:space-y-5">
      <StockSummary filters={filters} summary={summary} />

      <Panel className="overflow-hidden rounded-none border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <StockToolbar filters={filters} taxonomies={taxonomies} />
        <StockActiveFilters filters={filters} taxonomies={taxonomies} />
        <FeedbackBanner className="mx-5 mt-4" feedback={feedback} />

        {focusProductId && !focusedInPage ? (
          <p className="mx-5 mt-4 border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm font-medium text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
            O produto indicado pela notificação não está nesta página ou não corresponde aos
            filtros atuais.
          </p>
        ) : null}

        {snapshot.items.length === 0 ? (
          <div className="px-5 py-10">
            <div className="border-2 border-dashed border-[#1a1a1a] bg-white px-5 py-8 text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
                Nenhum item neste recorte
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#231f20]/64">
                Ajuste a busca ou os filtros para encontrar outros produtos do catálogo.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto px-2 pt-3">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="border-b border-brand-dark/20 px-2 py-3">
                    {selectableIds.length > 0 ? (
                      <StockSelectCell
                        checked={allSelected}
                        label={
                          allSelected
                            ? "Limpar seleção desta página"
                            : "Selecionar todos os produtos desta página"
                        }
                        onChange={(checked) =>
                          setSelectedIds(checked ? new Set(selectableIds) : new Set())
                        }
                      />
                    ) : null}
                  </th>
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
                {snapshot.items.map((item) =>
                  item.kit ? (
                    <KitStockRow
                      columnCount={tableHeaders.length + 1}
                      focused={item.productId === focusProductId}
                      item={item}
                      key={item.productId}
                      kit={item.kit}
                      lowStockThreshold={snapshot.lowStockThreshold}
                      onQtyChange={handleQtyChange}
                      quantities={quantities}
                      savingIds={savingIds}
                    />
                  ) : (
                    <StockRow
                      contactPhone={contactPhone}
                      focused={item.productId === focusProductId}
                      item={item}
                      key={item.productId}
                      lowStockThreshold={snapshot.lowStockThreshold}
                      onQtyChange={handleQtyChange}
                      onRequestData={setRequestItem}
                      onToggle={toggleItem}
                      qty={quantities[item.productId] ?? String(item.qty)}
                      requested={requestedIds.has(item.productId)}
                      saved={savedIds.has(item.productId)}
                      saving={savingIds.has(item.productId)}
                      selected={selectedIds.has(item.productId)}
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        <StockPagination
          filters={filters}
          page={snapshot.page}
          perPage={snapshot.perPage}
          total={snapshot.total}
          totalPages={totalPages}
        />
      </Panel>

      <StockSelectionBar
        onApply={applyBulkQty}
        onClear={() => setSelectedIds(new Set())}
        saving={bulkSaving}
        selectedCount={selectedIds.size}
      />

      <StockDataRequestModal
        contactPhone={contactPhone}
        item={requestItem}
        onClose={() => setRequestItem(null)}
        onSent={(productId) => {
          setRequestedIds((current) => new Set(current).add(productId));
          setFeedback({
            error: false,
            message: "Solicitação enviada à Papelito.",
          });
        }}
      />
    </div>
  );
}
