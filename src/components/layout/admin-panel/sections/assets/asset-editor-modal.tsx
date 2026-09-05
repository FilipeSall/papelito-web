"use client";

import { LoaderCircle, Save, X } from "lucide-react";
import { useId } from "react";

import { PrimaryButton } from "@/components/layout/admin-panel/primitives";
import { BaseModal } from "@/components/ui/base-modal";

import { AssetNotice, type AssetNoticeState } from "./asset-notice";
import { EYEBROW_TEXT_CLASS, MODAL_CLOSE_CLASS, SECONDARY_ACTION_CLASS } from "./assets-classes";

/**
 * Casca única dos editores de asset, na mesma gramática do modal de criação de vendor: faixa
 * amarela, supra-título de contexto real, corpo rolável e rodapé com Cancelar mais a ação primária.
 */
export function AssetEditorModal({
  children,
  description,
  eyebrow,
  extraActions,
  isSaveDisabled = false,
  isSaving = false,
  notice,
  onClose,
  onSave,
  open,
  saveLabel = "Salvar",
  size = "default",
  title,
}: {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  extraActions?: React.ReactNode;
  isSaveDisabled?: boolean;
  isSaving?: boolean;
  notice?: AssetNoticeState | null;
  onClose: () => void;
  onSave?: () => void;
  open: boolean;
  saveLabel?: string;
  size?: "default" | "wide";
  title: string;
}) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <BaseModal
      ariaDescribedBy={descriptionId}
      ariaLabelledBy={titleId}
      contentClassName={`max-h-[calc(100vh-3rem)] overflow-y-auto ${
        size === "wide" ? "max-w-5xl" : "max-w-3xl"
      }`}
      onClose={onClose}
      open={open}
    >
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 w-full bg-brand-yellow" />

        <header className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] px-6 py-5">
          <div className="min-w-0">
            <p className={EYEBROW_TEXT_CLASS}>{eyebrow}</p>
            <h2
              className="mt-2 text-2xl font-black uppercase tracking-tight text-[#1a1a1a]"
              id={titleId}
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#231f20]/70" id={descriptionId}>
              {description}
            </p>
          </div>
          <button
            aria-label="Fechar editor"
            className={MODAL_CLOSE_CLASS}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </header>

        <div className="space-y-5 px-6 py-5">
          {notice ? <AssetNotice notice={notice} /> : null}
          {children}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-[#1a1a1a] px-6 py-4">
          {extraActions}
          {onSave ? (
            <>
              <button className={SECONDARY_ACTION_CLASS} onClick={onClose} type="button">
                Cancelar
              </button>
              <PrimaryButton disabled={isSaving || isSaveDisabled} onClick={onSave}>
                {isSaving ? (
                  <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
                ) : (
                  <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                )}
                {saveLabel}
              </PrimaryButton>
            </>
          ) : (
            <PrimaryButton onClick={onClose}>Fechar</PrimaryButton>
          )}
        </footer>
      </div>
    </BaseModal>
  );
}
