"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

type BaseModalProps = {
  ariaDescribedBy?: string;
  ariaLabelledBy: string;
  children: ReactNode;
  /** Alinhamento e respiro da camada fixa; o padrão centraliza com `px-4 py-6`. Folhas de rodapé trocam por `items-end`. */
  containerClassName?: string;
  contentClassName?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Fundo do botão que escurece a tela; o padrão é `bg-brand-dark/70`. */
  overlayClassName?: string;
  onClose: () => void;
  open: boolean;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function BaseModal({
  ariaDescribedBy,
  ariaLabelledBy,
  children,
  containerClassName = "items-center justify-center px-4 py-6",
  contentClassName = "",
  initialFocusRef,
  overlayClassName = "bg-brand-dark/70",
  onClose,
  open,
}: BaseModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // O efeito abaixo move o foco. Se `onClose` entrasse nas dependências, um
  // `onClose` recriado a cada render — o caso comum — faria o efeito rodar a
  // cada tecla digitada e jogar o foco no primeiro elemento focável do diálogo,
  // deixando o formulário aceitar só o primeiro caractere de cada campo.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusables = dialog ? dialog.querySelectorAll<HTMLElement>(FOCUSABLE) : null;
    (initialFocusRef?.current ?? (focusables && focusables.length > 0 ? focusables[0] : dialog))?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) {
        return;
      }
      const nodes = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [initialFocusRef, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={`fixed inset-0 z-80 flex ${containerClassName}`.trim()}>
      <button
        aria-label="Fechar modal"
        className={`absolute inset-0 ${overlayClassName}`.trim()}
        data-testid="base-modal-overlay"
        onClick={onClose}
        type="button"
      />
      <div
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        className={`relative z-1 w-full ${contentClassName}`.trim()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
