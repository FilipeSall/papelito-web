"use client";

import { useEffect, useId, useRef, useState } from "react";

import { BaseModal } from "@/components/ui";
import { FOCUS_RING } from "@/components/layout/operational-panel";

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
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 w-full bg-[#c0392b]" />
        <div className="p-6">
        <h2
          className="text-lg font-black uppercase tracking-tight text-[#1a1a1a]"
          id={titleId}
        >
          Cancelar pedido
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#231f20]/74" id={descriptionId}>
          O cancelamento é definitivo e a justificativa abaixo fica registrada no histórico do
          pedido. O comprador vê esta atualização.
        </p>

        <label
          className="mt-5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
          htmlFor={`${titleId}-reason`}
        >
          Justificativa
        </label>
        <textarea
          aria-describedby={validationError ? `${titleId}-error` : undefined}
          aria-invalid={validationError ? true : undefined}
          className={["mt-2 min-h-28 w-full resize-y border-2 border-[#1a1a1a] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/40 disabled:opacity-60", FOCUS_RING].join(" ")}
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
            className="mt-2 text-sm font-bold text-[#c0392b]"
            id={`${titleId}-error`}
            role="alert"
          >
            ⚠ {validationError}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 border-2 border-[#c0392b] bg-white px-4 py-3 text-sm font-bold text-[#c0392b]" role="alert">
            ⚠ {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            className={["inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-45", FOCUS_RING].join(" ")}
            disabled={isSubmitting}
            onClick={handleClose}
            type="button"
          >
            Voltar
          </button>
          <button
            className={["inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#c0392b] transition hover:bg-[#c0392b]/8 disabled:cursor-not-allowed disabled:opacity-45", FOCUS_RING].join(" ")}
            disabled={isSubmitting}
            onClick={handleConfirm}
            type="button"
          >
            {isSubmitting ? "Cancelando…" : "Confirmar cancelamento"}
          </button>
        </div>
        </div>
      </div>
    </BaseModal>
  );
}
