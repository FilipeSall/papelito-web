"use client";

import { useMemo } from "react";
import { useCartStore, useCartSummary } from "@/features/cart";
import { formatBRL } from "@/lib/format-currency";
import { SecurityLockIcon } from "./checkout-icons";

export function CheckoutOrderSummary() {
  const items = useCartStore((state) => state.items);
  const summary = useCartSummary();

  const orderLines = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        label: `${item.name} x${item.quantity}`,
        total: formatBRL(item.price * item.quantity),
      })),
    [items],
  );

  return (
    <aside className="h-fit rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-sm font-black uppercase tracking-[-0.1504px] text-brand-dark">
        Resumo
      </h2>

      <div className="mt-4 space-y-2">
        {orderLines.map((line) => (
          <div className="flex items-center justify-between gap-3" key={line.id}>
            <p className="truncate text-sm tracking-[-0.1504px] text-text-tertiary">{line.label}</p>
            <p className="shrink-0 text-sm font-medium text-brand-dark">{line.total}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-[#F3F4F6] pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-tertiary">Frete</span>
          <span className="text-sm font-medium text-brand-dark">{formatBRL(summary.shipping)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[28px] font-black leading-7 tracking-[-0.4492px] text-brand-dark">
            Total
          </span>
          <span className="text-[32px] font-black leading-8 tracking-[-0.4492px] text-brand-dark">
            {formatBRL(summary.total)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-[14px] bg-bg-light px-3 py-3">
        <SecurityLockIcon />
        <p className="text-xs leading-4 text-text-muted">Pagamento 100% seguro e criptografado</p>
      </div>
    </aside>
  );
}
