"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type BaseModalProps = {
  ariaDescribedBy?: string;
  ariaLabelledBy: string;
  children: ReactNode;
  contentClassName?: string;
  onClose: () => void;
  open: boolean;
};

export function BaseModal({
  ariaDescribedBy,
  ariaLabelledBy,
  children,
  contentClassName = "",
  onClose,
  open,
}: BaseModalProps) {
  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-80 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 bg-brand-dark/70"
        data-testid="base-modal-overlay"
        onClick={onClose}
        type="button"
      />
      <div
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        className={`relative z-1 w-full ${contentClassName}`.trim()}
        role="dialog"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
