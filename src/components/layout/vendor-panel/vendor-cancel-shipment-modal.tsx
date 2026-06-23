"use client";

import { useEffect, useId, useRef, useState } from "react";

import { BaseModal } from "@/components/ui";

type VendorCancelShipmentModalProps = {
  open: boolean;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function VendorCancelShipmentModal({
  open,
  isSubmitting = false,
  errorMessage = null,
  onClose,
  onConfirm,
}: VendorCancelShipmentModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  function reset() {
    setReason("");
    setValidationError(null);
  }

  function handleConfirm() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError("Informe o motivo do cancelamento.");
      textareaRef.current?.focus();
      return;
    }
    setValidationError(null);
    onConfirm(trimmed);
  }

  function handleClose() {
    if (isSubmitting) return;
    reset();
    onClose();
  }

  return (
    <BaseModal
      ariaDescribedBy={descriptionId}
      ariaLabelledBy={titleId}
      contentClassName="max-w-md"
      onClose={handleClose}
      open={open}
    >
      <div className="rounded-2xl border-2 border-brand-dark bg-white p-6 shadow-[8px_8px_0_rgba(35,31,32,0.12)]">
        <h2
          className="text-lg font-black uppercase tracking-tight text-brand-dark"
          id={titleId}
        >
          Cancelar envio do pedido
        </h2>
        <p className="mt-3 text-sm leading-5 text-text-secondary" id={descriptionId}>
          O cancelamento e definitivo e a justificativa abaixo sera registrada no
          historico do pedido. O cliente vera esta atualizacao.
        </p>

        <label
          className="mt-5 block text-[11px] font-black uppercase tracking-[0.22em] text-brand-dark/70"
          htmlFor={`${titleId}-reason`}
        >
          Justificativa
        </label>
        <textarea
          aria-describedby={validationError ? `${titleId}-error` : undefined}
          aria-invalid={validationError ? true : undefined}
          className="mt-2 min-h-28 w-full resize-y rounded-xl border border-brand-dark/16 bg-[#FFFDF8] px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-dark focus:ring-4 focus:ring-[#FFF1A6] disabled:opacity-60"
          disabled={isSubmitting}
          id={`${titleId}-reason`}
          onChange={(event) => {
            setReason(event.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder="Explique por que o envio esta sendo cancelado."
          ref={textareaRef}
          value={reason}
        />
        {validationError ? (
          <p
            className="mt-2 text-sm font-semibold text-[#c0392b]"
            id={`${titleId}-error`}
            role="alert"
          >
            {validationError}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 rounded-[12px] border border-[#c0392b] bg-[#c0392b]/10 px-4 py-3 text-sm font-semibold text-[#c0392b]" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            className="cursor-pointer rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wide text-brand-dark transition hover:bg-bg-light disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            onClick={handleClose}
            type="button"
          >
            Voltar
          </button>
          <button
            className="cursor-pointer rounded-full border border-[#c0392b] bg-[#c0392b] px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-[#a5301f] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={handleConfirm}
            type="button"
          >
            {isSubmitting ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
