"use client";

import { useMemo } from "react";
import { useCartPricing, useCartStore, useCartSummary } from "@/features/cart";
import { formatBRL } from "@/lib/format-currency";
import { SecurityLockIcon } from "./checkout-icons";

export function CheckoutOrderSummary() {
  const items = useCartStore((state) => state.items);
  const summary = useCartSummary();
  const pricingError = useCartStore((state) => state.pricingError);
  const pricingRequiresConfirmation = useCartStore(
    (state) => state.pricingRequiresConfirmation,
  );
  const confirmPricingAdjustments = useCartStore(
    (state) => state.confirmPricingAdjustments,
  );
  const { isPricing } = useCartPricing();

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
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-text-tertiary">Subtotal</span>
          <span className="text-sm font-medium text-brand-dark">{formatBRL(summary.subtotal)}</span>
        </div>

        {summary.discount > 0 ? (
          <div className="mt-2 flex items-center justify-between text-[#16A34A]">
            <span className="text-sm">Descontos</span>
            <span className="text-sm font-medium">- {formatBRL(summary.discount)}</span>
          </div>
        ) : null}

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

      {isPricing ? (
        <p className="mt-4 text-xs text-text-muted">Recalculando preços e descontos...</p>
      ) : null}

      {pricingRequiresConfirmation ? (
        <div className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-3 text-xs text-[#92400E]" role="alert">
          <p>A oferta mudou ou expirou e o preço normal foi restaurado.</p>
          <button
            className="mt-2 cursor-pointer font-black uppercase underline"
            onClick={confirmPricingAdjustments}
            type="button"
          >
            Confirmar novos preços
          </button>
        </div>
      ) : null}

      {pricingError ? (
        <p className="mt-4 rounded-[12px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B42318]" role="alert">
          {pricingError}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-2 rounded-[14px] bg-bg-light px-3 py-3">
        <SecurityLockIcon />
        <p className="text-xs leading-4 text-text-muted">Pagamento 100% seguro e criptografado</p>
      </div>
    </aside>
  );
}
