"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

type VendorStockEditModalProps = {
  errorMessage: string | null;
  initialQty: number;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (payload: { qty: number; reason: string }) => void;
  productName: string;
};

export function VendorStockEditModal({
  errorMessage,
  initialQty,
  loading,
  onCancel,
  onConfirm,
  productName,
}: VendorStockEditModalProps) {
  const [qty, setQty] = useState(String(initialQty));
  const [reason, setReason] = useState("");

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [loading, onCancel]);

  const parsedQty = Number(qty);
  const cleanReason = reason.trim();
  const canConfirm =
    Number.isInteger(parsedQty) && parsedQty >= 0 && cleanReason.length >= 10 && !loading;

  return (
    <div
      aria-modal="true"
      aria-labelledby="vendor-stock-edit-title"
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8"
      role="dialog"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#231f20]/10 px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4b4731]">
              Ajuste manual
            </p>
            <h3 id="vendor-stock-edit-title" className="text-lg font-semibold text-[#1e1c10]">
              Atualizar estoque
            </h3>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#1e1c10] transition hover:bg-[#f6f1da] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={loading}
            onClick={onCancel}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-6 text-[#4b4731]">
            Defina o novo saldo de{" "}
            <span className="font-semibold text-[#1e1c10]">{productName}</span> e registre o
            motivo para auditoria.
          </p>

          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#4b4731]">
            Quantidade atualizada
            <input
              autoFocus
              className="mt-2 h-11 w-full rounded-xl border border-[#231f20]/14 bg-white px-3 text-sm text-[#231f20] outline-none focus:border-[#231f20]"
              disabled={loading}
              min={0}
              onChange={(event) => setQty(event.target.value)}
              type="number"
              value={qty}
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#4b4731]">
            Motivo do ajuste
            <textarea
              className="mt-2 block h-28 w-full resize-none rounded-xl border border-[#231f20]/14 bg-white px-3 py-2 text-sm text-[#231f20] outline-none focus:border-[#231f20]"
              disabled={loading}
              maxLength={120}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explique por que o saldo esta sendo alterado."
              value={reason}
            />
          </label>

          {errorMessage ? (
            <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-xs text-[#b91c1c]">
              {errorMessage}
            </p>
          ) : cleanReason.length > 0 && cleanReason.length < 10 ? (
            <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-xs text-[#b91c1c]">
              Motivo obrigatorio com pelo menos 10 caracteres.
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#231f20]/10 px-6 py-4">
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center rounded-[12px] border border-[#cec7aa] bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#1e1c10] transition hover:bg-[#f6f1da] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[12px] bg-[#231f20] px-5 text-xs font-semibold uppercase tracking-[0.06em] text-[#ffe500] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canConfirm}
            onClick={() => onConfirm({ qty: parsedQty, reason: cleanReason })}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Salvando...
              </>
            ) : (
              "Salvar ajuste"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
