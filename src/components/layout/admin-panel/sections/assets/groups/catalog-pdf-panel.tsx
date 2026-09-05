"use client";

import { ExternalLink, FileText, LoaderCircle, RotateCcw, Upload } from "lucide-react";

import { AssetWarning } from "../asset-notice";
import { HARD_BOX_CLASS, SECONDARY_ACTION_CLASS } from "../assets-classes";
import { ALERT_ERROR_CLASS, BUTTON_CLASS, HINT_CLASS } from "../field-classes";

import { resolveCatalogHref, type CatalogSnapshot } from "./use-catalog-pdf";

export function CatalogPdfPanel({
  isLoading,
  isRestoring,
  isUploading,
  onRestore,
  onUpload,
  snapshot,
}: {
  isLoading: boolean;
  isRestoring: boolean;
  isUploading: boolean;
  onRestore: () => void | Promise<void>;
  onUpload: (file: File) => void | Promise<void>;
  snapshot: CatalogSnapshot | null;
}) {
  const active = snapshot?.activeCatalog;
  const configured = snapshot?.configuredCatalog;
  const isCustomActive = active?.source === "custom";
  const activeHref = resolveCatalogHref(active?.url);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm leading-6 text-[#231f20]/70">
          Controle o arquivo aberto pelo botão da página de revendedores.
        </p>

        <label
          className={`${BUTTON_CLASS} shrink-0 ${
            isUploading ? "pointer-events-none cursor-not-allowed opacity-60" : ""
          } focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1a1a1a]`}
        >
          {isUploading ? (
            <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <Upload aria-hidden className="h-4 w-4" strokeWidth={2.4} />
          )}
          {isUploading ? "Enviando..." : "Enviar PDF"}
          <input
            accept="application/pdf,.pdf"
            aria-label="Enviar PDF do catálogo"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void onUpload(file);
              }
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      </div>

      <div className={HARD_BOX_CLASS}>
        {isLoading ? (
          <div className="flex h-28 items-center justify-center text-xs font-black uppercase tracking-widest text-[#231f20]/56">
            <LoaderCircle aria-hidden className="mr-2 h-4 w-4 animate-spin" />
            Carregando
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-brand-yellow">
                  <FileText aria-hidden className="h-5 w-5 text-[#1a1a1a]" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
                    Arquivo ativo
                  </p>
                  <p className="truncate text-sm font-black text-[#1a1a1a]">
                    {active?.filename ?? "catalogo-papelito.pdf"}
                  </p>
                  <p className="mt-1.5 inline-flex items-center border-2 border-[#1a1a1a] bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/70">
                    {isCustomActive ? "Personalizado" : "Padrão Papelito"}
                  </p>
                </div>
              </div>
            </div>

            {configured?.isAvailable === false ? (
              <p className={ALERT_ERROR_CLASS} role="alert">
                ⚠ O catálogo personalizado configurado está indisponível. O PDF padrão está ativo.
              </p>
            ) : null}

            {snapshot?.issues?.length ? <AssetWarning>{snapshot.issues.join(" ")}</AssetWarning> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                className={SECONDARY_ACTION_CLASS}
                href={activeHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                Abrir prévia
              </a>
              <button
                className={SECONDARY_ACTION_CLASS}
                disabled={!isCustomActive || isRestoring}
                onClick={() => void onRestore()}
                type="button"
              >
                {isRestoring ? (
                  <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                )}
                Restaurar padrão
              </button>
            </div>
          </div>
        )}
      </div>

      <p className={HINT_CLASS}>O arquivo precisa ser PDF e ter até 10 MB.</p>
    </div>
  );
}
