"use client";

import { useState } from "react";

import { Panel } from "@/components/layout/operational-panel";
import type {
  VendorStockFilter,
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
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const focusedInPage = snapshot.items.some((item) => item.productId === focusProductId);
  const totalPages = Math.max(1, Math.ceil(snapshot.total / snapshot.perPage));

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
                    onFeedback={(message, error = false) => setFeedback({ error, message })}
                  />
                ))}
              </tbody>
            </table>
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
