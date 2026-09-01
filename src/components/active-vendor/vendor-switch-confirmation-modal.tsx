"use client";

import { useEscapeKey } from "@/hooks/use-escape-key";

interface VendorSwitchConfirmationModalProps {
  open: boolean;
  targetVendorName: string;
  cartItemCount: number;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function VendorSwitchConfirmationModal({
  open,
  targetVendorName,
  cartItemCount,
  isSubmitting = false,
  errorMessage = null,
  onCancel,
  onConfirm,
}: VendorSwitchConfirmationModalProps) {
  useEscapeKey(onCancel, { enabled: open && !isSubmitting });

  if (!open) return null;

  const hasCartItems = cartItemCount > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-switch-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
    >
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={() => !isSubmitting && onCancel()}
        className="absolute inset-0 bg-brand-dark/60"
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2
          id="vendor-switch-title"
          className="text-lg font-black uppercase tracking-tight text-brand-dark"
        >
          Trocar vendor?
        </h2>
        <p className="mt-3 text-sm leading-5 text-text-secondary">
          Você está trocando para <strong className="text-brand-dark">{targetVendorName}</strong>.
          O frete dos produtos pode mudar e o catálogo será atualizado de acordo com o estoque deste vendor.
        </p>
        {hasCartItems ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            Você tem <strong>{cartItemCount}</strong> {cartItemCount === 1 ? "item" : "itens"} no carrinho. Trocar de vendor vai esvaziar o carrinho.
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="cursor-pointer rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide text-brand-dark transition hover:bg-bg-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="cursor-pointer rounded-full bg-brand-dark px-4 py-2 text-xs font-black uppercase tracking-wide text-brand-yellow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Trocando..." : "Confirmar troca"}
          </button>
        </div>
      </div>
    </div>
  );
}
