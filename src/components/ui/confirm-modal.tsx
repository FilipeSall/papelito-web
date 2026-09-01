"use client";

import { useId, useRef } from "react";

import { BaseModal } from "./base-modal";

type ConfirmModalProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  tone?: "default" | "danger";
};

export function ConfirmModal({
  cancelLabel = "Cancelar",
  confirmLabel,
  description,
  isSubmitting = false,
  onClose,
  onConfirm,
  open,
  title,
  tone = "default",
}: Readonly<ConfirmModalProps>) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  return (
    <BaseModal
      ariaDescribedBy={descriptionId}
      ariaLabelledBy={titleId}
      contentClassName="max-w-md"
      initialFocusRef={cancelRef}
      onClose={handleClose}
      open={open}
    >
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div className="h-2 w-full bg-brand-yellow" />
        <div className="p-6">
          <h2
            className="text-lg font-black uppercase tracking-tight text-[#1a1a1a]"
            id={titleId}
          >
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#1a1a1a]/70" id={descriptionId}>
            {description}
          </p>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              className="cursor-pointer border-2 border-[#1a1a1a] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#1a1a1a] transition hover:bg-[#1a1a1a]/5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={handleClose}
              ref={cancelRef}
              type="button"
            >
              {cancelLabel}
            </button>
            <button
              className={`cursor-pointer border-2 border-[#1a1a1a] px-5 py-3 text-xs font-black uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${
                tone === "danger"
                  ? "bg-[#c0392b] text-white shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a]"
                  : "bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500] hover:shadow-[1px_1px_0px_#ffe500]"
              }`}
              disabled={isSubmitting}
              onClick={onConfirm}
              type="button"
            >
              {isSubmitting ? "Confirmando..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
