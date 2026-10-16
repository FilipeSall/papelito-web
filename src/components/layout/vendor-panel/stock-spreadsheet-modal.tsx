"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Download, FileSpreadsheet, X } from "lucide-react";

import { BaseModal } from "@/components/ui/base-modal";
import { FOCUS_RING } from "@/components/layout/operational-panel";
import type { SkuImportFeedback } from "@/features/vendor-sku-import/utils/sku-import-decisions";

import { SkuImportPanel } from "./sku-import-panel";

type SpreadsheetTab = "export" | "import";

const TABS: { key: SpreadsheetTab; label: string }[] = [
  { key: "export", label: "Exportar" },
  { key: "import", label: "Importar" },
];

const EXPORT_LINKS = [
  { format: "Excel (.xlsx)", href: "/api/vendor/stock/export" },
  { format: "CSV (.csv)", href: "/api/vendor/stock/export?format=csv" },
];

const tabId = (tab: SpreadsheetTab) => `stock-spreadsheet-tab-${tab}`;
const panelId = (tab: SpreadsheetTab) => `stock-spreadsheet-panel-${tab}`;

type StockSpreadsheetModalProps = {
  /** Modal visível. */
  open: boolean;
  /** Fecha o modal. */
  onClose: () => void;
  /** Recebe a mensagem final da importação para o banner da página. */
  onImported: (feedback: SkuImportFeedback) => void;
};

/**
 * Planilha do estoque: exportar (o download que já existia) ou importar códigos SKU.
 * A importação sempre passa por prévia; o modal fica aberto no resultado para conferência.
 */
export function StockSpreadsheetModal({ onClose, onImported, open }: Readonly<StockSpreadsheetModalProps>) {
  const [tab, setTab] = useState<SpreadsheetTab>("export");
  const tabRefs = useRef(new Map<SpreadsheetTab, HTMLButtonElement>());

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next: SpreadsheetTab = tab === "export" ? "import" : "export";
    setTab(next);
    tabRefs.current.get(next)?.focus();
  }

  return (
    <BaseModal ariaLabelledBy="stock-spreadsheet-title" contentClassName="max-w-5xl" onClose={onClose} open={open}>
      <div className="flex max-h-[calc(100dvh-3rem)] flex-col border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 w-full flex-none bg-brand-yellow" />
        <div className="flex flex-none items-start justify-between gap-3 border-b-2 border-[#1a1a1a] px-5 py-4">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]" id="stock-spreadsheet-title">
              Planilha de estoque
            </h2>
            <div aria-label="Ação com a planilha" className="mt-3 flex gap-2" role="tablist">
              {TABS.map(({ key, label }) => (
                <button
                  aria-controls={panelId(key)}
                  aria-selected={tab === key}
                  className={[
                    "border-2 border-[#1a1a1a] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition",
                    tab === key ? "bg-[#1a1a1a] text-brand-yellow" : "bg-white text-[#1a1a1a] hover:bg-brand-yellow",
                    FOCUS_RING,
                  ].join(" ")}
                  id={tabId(key)}
                  key={key}
                  onClick={() => setTab(key)}
                  onKeyDown={handleKeyDown}
                  ref={(node) => {
                    if (node) tabRefs.current.set(key, node);
                  }}
                  role="tab"
                  tabIndex={tab === key ? 0 : -1}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            aria-label="Fechar"
            className={["inline-flex size-9 flex-none items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-brand-yellow", FOCUS_RING].join(" ")}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="size-4" strokeWidth={2.4} />
          </button>
        </div>

        <div aria-labelledby={tabId(tab)} className="min-h-0 flex-1 overflow-y-auto px-5 py-5" id={panelId(tab)} role="tabpanel">
          {tab === "export" ? <StockExportOptions /> : <SkuImportPanel onClose={onClose} onFinished={onImported} />}
        </div>
      </div>
    </BaseModal>
  );
}

function StockExportOptions() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[#231f20]/75">
        Baixe o estoque inteiro com SKU, produto, quantidade e data da última atualização.
      </p>
      <div className="flex flex-wrap gap-3">
        {EXPORT_LINKS.map((link) => (
          <a
            className={[
              "inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transition hover:bg-brand-yellow hover:shadow-[1px_1px_0px_#1a1a1a] active:shadow-none",
              FOCUS_RING,
            ].join(" ")}
            download
            href={link.href}
            key={link.href}
          >
            <Download aria-hidden className="size-4" strokeWidth={2.4} />
            {link.format}
          </a>
        ))}
      </div>
    </div>
  );
}

type StockSpreadsheetButtonProps = {
  /** Recebe a mensagem final da importação para o banner da página. */
  onImported: (feedback: SkuImportFeedback) => void;
};

/**
 * Botão da barra do estoque que abre a planilha (exportar ou importar).
 * Só o ícone fica na barra; o nome da ação aparece num tooltip no hover e no foco por teclado.
 */
export function StockSpreadsheetButton({ onImported }: Readonly<StockSpreadsheetButtonProps>) {
  const [open, setOpen] = useState(false);

  return (
    <span className="group/export relative inline-flex flex-none self-start lg:self-auto">
      <button
        aria-haspopup="dialog"
        aria-label="Planilha de estoque: exportar ou importar"
        className={[
          "inline-flex size-11 items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transition hover:bg-brand-yellow hover:shadow-[1px_1px_0px_#1a1a1a] active:shadow-none",
          FOCUS_RING,
        ].join(" ")}
        onClick={() => setOpen(true)}
        type="button"
      >
        <FileSpreadsheet aria-hidden className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute top-full right-0 z-30 mt-2.5 w-max -translate-y-1 bg-[#1a1a1a] px-3 py-2 text-[10px] font-black uppercase leading-none tracking-[0.14em] text-[#f5f1e8] opacity-0 shadow-[3px_3px_0px_#ffe500] transition duration-150 group-has-focus-visible/export:translate-y-0 group-has-focus-visible/export:opacity-100 group-hover/export:translate-y-0 group-hover/export:opacity-100 motion-reduce:transition-none"
      >
        <span className="absolute -top-1 right-4 size-2 rotate-45 bg-[#1a1a1a]" />
        <span className="relative">Exportar ou importar planilha</span>
      </span>
      <StockSpreadsheetModal onClose={() => setOpen(false)} onImported={onImported} open={open} />
    </span>
  );
}
