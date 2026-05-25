"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { useEffect } from "react";

import type { Coupon } from "@/features/coupons/types/coupon";

type CouponDeleteModalProps = {
  coupon: Coupon;
  deleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CouponDeleteModal({
  coupon,
  deleting,
  errorMessage,
  onCancel,
  onConfirm,
}: CouponDeleteModalProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) onCancel();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [deleting, onCancel]);

  return (
    <div
      aria-modal="true"
      aria-labelledby="coupon-delete-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8"
      role="dialog"
      onClick={() => !deleting && onCancel()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#231f20]/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fee2e2]">
              <AlertTriangle className="h-5 w-5 text-[#b91c1c]" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4b4731]">
                Confirmacao
              </p>
              <h3
                id="coupon-delete-title"
                className="text-lg font-semibold text-[#1e1c10]"
              >
                Remover cupom?
              </h3>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#1e1c10] transition hover:bg-[#f6f1da] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={deleting}
            onClick={onCancel}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-6 text-[#4b4731]">
            Voce esta prestes a remover o cupom{" "}
            <span className="rounded-md bg-[#fff9ea] px-2 py-0.5 font-mono text-xs font-semibold uppercase text-[#1e1c10]">
              {coupon.code}
            </span>
            . Essa acao nao pode ser desfeita.
          </p>

          {coupon.usageCount > 0 ? (
            <p className="rounded-xl border border-[#fde68a] bg-[#fef3c7] px-3 py-2 text-xs leading-5 text-[#92400e]">
              Este cupom ja foi usado <strong>{coupon.usageCount}</strong>{" "}
              {coupon.usageCount === 1 ? "vez" : "vezes"}. Pedidos antigos continuarao
              referenciando o codigo.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-xs text-[#b91c1c]">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#231f20]/10 px-6 py-4">
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center rounded-[12px] border border-[#cec7aa] bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#1e1c10] transition hover:bg-[#f6f1da] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleting}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[12px] bg-[#b91c1c] px-5 text-xs font-semibold uppercase tracking-[0.06em] text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Removendo...
              </>
            ) : (
              "Remover cupom"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
