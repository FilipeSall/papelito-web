"use client";

import { AlertTriangle, LoaderCircle, X } from "lucide-react";

import type { AdminKit } from "@/lib/server/admin-kits";
import { useEscapeKey } from "@/hooks/use-escape-key";

type KitDeleteModalProps = Readonly<{
  deleting: boolean;
  error: string;
  kit: AdminKit;
  onCancel: () => void;
  onConfirm: () => void;
}>;

export function KitDeleteModal({
  deleting,
  error,
  kit,
  onCancel,
  onConfirm,
}: KitDeleteModalProps) {
  useEscapeKey(onCancel, { enabled: !deleting });

  return (
    <div
      aria-labelledby="kit-delete-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#231f20]/70 p-4"
      onClick={() => !deleting && onCancel()}
      role="dialog"
    >
      <section
        className="w-full max-w-md border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0_#1a1a1a]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-2 bg-brand-yellow" />
        <header className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center border-2 border-[#1a1a1a] bg-[#fff0ed] text-[#8b1f16]">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em]">
                Confirmação
              </p>
              <h3 className="mt-1 text-xl font-black uppercase" id="kit-delete-title">
                Excluir Kit?
              </h3>
            </div>
          </div>
          <button
            aria-label="Fechar confirmação"
            className="grid size-9 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-brand-yellow disabled:opacity-50"
            disabled={deleting}
            onClick={onCancel}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="space-y-4 px-5 py-5 text-sm leading-6 text-[#5e574c]">
          <p>
            Você vai excluir definitivamente o Kit <strong className="text-[#231f20]">{kit.name}</strong> e o produto comercial associado.
          </p>
          <p className="border-2 border-[#1a1a1a] bg-brand-yellow px-3 py-2 text-xs font-bold leading-5 text-[#231f20]">
            As imagens exclusivas serão apagadas do storage. Imagens usadas em outro conteúdo serão preservadas.
          </p>
          {error ? (
            <p className="border-2 border-[#c0392b] bg-[#fff0ed] px-3 py-2 text-xs text-[#8b1f16]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <footer className="flex justify-end gap-3 border-t-2 border-[#1a1a1a] bg-white px-5 py-4">
          <button
            className="h-10 border-2 border-[#1a1a1a] px-4 text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow disabled:opacity-50"
            disabled={deleting}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 border-2 border-[#1a1a1a] bg-[#c0392b] px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50"
            disabled={deleting}
            onClick={onConfirm}
            type="button"
          >
            {deleting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {deleting ? "Excluindo…" : "Excluir Kit"}
          </button>
        </footer>
      </section>
    </div>
  );
}
