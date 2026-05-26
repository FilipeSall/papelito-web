"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

type VendorRejectModalProps = {
  errorMessage: string | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  vendorName: string;
};

export function VendorRejectModal({
  errorMessage,
  loading,
  onCancel,
  onConfirm,
  vendorName,
}: VendorRejectModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [loading, onCancel]);

  const trimmed = reason.trim();
  const canConfirm = trimmed.length > 0 && !loading;

  return (
    <div
      aria-modal="true"
      aria-labelledby="vendor-reject-title"
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8"
      role="dialog"
      onClick={() => !loading && onCancel()}
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
              <h3 id="vendor-reject-title" className="text-lg font-semibold text-[#1e1c10]">
                Recusar vendor?
              </h3>
            </div>
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
            Voce esta prestes a recusar a solicitacao de{" "}
            <span className="font-semibold text-[#1e1c10]">{vendorName}</span>. O vendor recebera
            um email com o motivo informado.
          </p>

          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#4b4731]">
            Motivo da recusa
            <textarea
              autoFocus
              className="mt-2 block h-28 w-full resize-none rounded-xl border border-[#231f20]/14 bg-white px-3 py-2 text-sm text-[#231f20] outline-none focus:border-[#231f20]"
              disabled={loading}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ex.: CNPJ fora da regiao de cobertura atual."
              value={reason}
            />
          </label>

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
            disabled={loading}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[12px] bg-[#b91c1c] px-5 text-xs font-semibold uppercase tracking-[0.06em] text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canConfirm}
            onClick={() => onConfirm(trimmed)}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Recusando...
              </>
            ) : (
              "Confirmar recusa"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
