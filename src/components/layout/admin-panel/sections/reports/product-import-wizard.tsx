"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileDown, LoaderCircle, ServerCrash, X } from "lucide-react";

import {
  confirmProductImport,
  previewProductImport,
  ProductImportError,
} from "@/features/admin-product-import/services/admin-product-import-client";
import type {
  ProductImportMissingColumns,
  ProductImportPreview,
  ProductImportResult,
} from "@/features/admin-product-import/types/admin-product-import";
import {
  downloadCsv,
  productImportCounts,
  productImportErrorReportCsv,
  productImportTemplateCsv,
  type ProductImportFilter,
} from "@/features/admin-product-import/utils/product-import-decisions";
import { BaseModal } from "@/components/ui/base-modal";

import { FOCUS_RING, PrimaryButton } from "../../primitives";
import { ProductImportFileError, ProductImportResultView } from "./product-import-outcome";
import { ProductImportReview } from "./product-import-review";

type WizardPhase =
  | { kind: "reading" }
  | { kind: "file-error"; message: string; missingColumns: ProductImportMissingColumns | null }
  | { kind: "review"; preview: ProductImportPreview; confirming: boolean; error: string | null; expired: boolean }
  | { kind: "saving"; preview: ProductImportPreview }
  | { kind: "done"; preview: ProductImportPreview; result: ProductImportResult };

type ProductImportWizardProps = {
  /** Planilha escolhida; a conferência começa assim que o assistente abre. */
  file: File;
  /** Fecha o assistente; `imported` diz se um lote foi criado, para a página se atualizar. */
  onClose: (imported: boolean) => void;
};

const SECONDARY =
  "inline-flex min-h-11 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-45";
const GHOST =
  "inline-flex min-h-11 items-center gap-2 border-2 border-transparent px-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a] hover:border-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-45";

function errorReportName(fileName: string): string {
  return `${fileName.replace(/\.(csv|xlsx)$/i, "") || "planilha"}-erros.csv`;
}

function readFailure(error: unknown): WizardPhase {
  if (error instanceof ProductImportError) {
    return { kind: "file-error", message: error.message, missingColumns: error.missingColumns };
  }
  return { kind: "file-error", message: error instanceof Error ? error.message : "Não foi possível ler a planilha.", missingColumns: null };
}

function stepOf(phase: WizardPhase): number {
  if (phase.kind === "review") return 1;
  if (phase.kind === "saving" || phase.kind === "done") return 2;
  return 0;
}

/**
 * Assistente da importação de produtos: lê a planilha no WordPress, mostra a conferência,
 * pede confirmação e cria o lote. O lote entra inteiro ou não entra; enquanto grava, o
 * assistente não fecha.
 */
export function ProductImportWizard({ file, onClose }: Readonly<ProductImportWizardProps>) {
  const [phase, setPhase] = useState<WizardPhase>({ kind: "reading" });
  const [createLines, setCreateLines] = useState<ReadonlySet<number>>(new Set());
  const [filter, setFilter] = useState<ProductImportFilter>("todas");
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    let active = true;
    previewProductImport(file)
      .then((preview) => {
        if (active) setPhase({ kind: "review", preview, confirming: false, error: null, expired: false });
      })
      .catch((error: unknown) => {
        if (active) setPhase(readFailure(error));
      });
    return () => {
      active = false;
    };
  }, [file]);

  function close() {
    if (phase.kind === "saving") return;
    onClose(phase.kind === "done");
  }

  function toggleCreate(line: number, create: boolean) {
    setCreateLines((current) => {
      const next = new Set(current);
      if (create) next.add(line);
      else next.delete(line);
      return next;
    });
  }

  async function commit(preview: ProductImportPreview) {
    setPhase({ kind: "saving", preview });
    try {
      const result = await confirmProductImport({ token: preview.token, createLines: [...createLines], acknowledgeRepeat: acknowledged });
      setPhase({ kind: "done", preview, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível cadastrar os produtos.";
      const expired = error instanceof ProductImportError && error.code === "papelito_product_import_expired";
      setPhase({ kind: "review", preview, confirming: false, error: message, expired });
    }
  }

  return (
    <BaseModal ariaLabelledBy="product-import-title" contentClassName="max-w-5xl" onClose={close} open>
      <div className="flex max-h-[calc(100dvh-3rem)] flex-col border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 shrink-0 bg-brand-yellow" />
        <header className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-[#1a1a1a] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">Relatórios · Importar produtos</p>
            <h2 className="mt-1 truncate text-xl font-black uppercase tracking-tight text-[#1a1a1a]" id="product-import-title">
              {file.name}
            </h2>
          </div>
          <button aria-label="Fechar" className={["grid size-11 shrink-0 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-[#1a1a1a] hover:text-white disabled:opacity-45", FOCUS_RING].join(" ")} disabled={phase.kind === "saving"} onClick={close} type="button">
            <X aria-hidden className="size-4" strokeWidth={2.4} />
          </button>
        </header>
        <WizardSteps current={stepOf(phase)} />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <WizardBody acknowledged={acknowledged} createLines={createLines} filter={filter} onAcknowledge={setAcknowledged} onFilter={setFilter} onToggleCreate={toggleCreate} phase={phase} />
        </div>
        <WizardFooter acknowledged={acknowledged} createLines={createLines} onClose={close} onCommit={commit} onPhase={setPhase} phase={phase} />
      </div>
    </BaseModal>
  );
}

function WizardSteps({ current }: Readonly<{ current: number }>) {
  const steps = ["Arquivo", "Conferência", "Cadastro"];
  return (
    <ol className="flex shrink-0 px-5 pt-4">
      {steps.map((label, index) => {
        const state = index === current ? "bg-brand-yellow text-[#1a1a1a]" : "bg-white text-[#1a1a1a]/55";
        return (
          <li
            aria-current={index === current ? "step" : undefined}
            className={["-ml-0.5 flex min-w-0 flex-1 items-center gap-2 border-2 border-[#1a1a1a] px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] first:ml-0", index < current ? "bg-[#f7f2e7] text-[#1a1a1a]" : state].join(" ")}
            key={label}
          >
            <span className="grid size-5.5 shrink-0 place-items-center border-2 border-current font-(family-name:--font-admin-mono)">{index + 1}</span>
            <span className="truncate">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

type WizardBodyProps = {
  acknowledged: boolean;
  createLines: ReadonlySet<number>;
  filter: ProductImportFilter;
  onAcknowledge: (value: boolean) => void;
  onFilter: (filter: ProductImportFilter) => void;
  onToggleCreate: (line: number, create: boolean) => void;
  phase: WizardPhase;
};

function WizardBody({ phase, ...review }: Readonly<WizardBodyProps>) {
  switch (phase.kind) {
    case "reading":
      return <Progress label="Lendo a planilha e conferindo o catálogo…" />;
    case "file-error":
      return <ProductImportFileError message={phase.message} missingColumns={phase.missingColumns} />;
    case "saving":
      return <Progress label={`Cadastrando ${productImportCounts(phase.preview.rows, review.createLines).entram} produtos… Não feche esta janela.`} />;
    case "done":
      return <ProductImportResultView result={phase.result} />;
    default:
      return (
        <div className="grid gap-4">
          <SaveError error={phase.error} />
          <ProductImportReview preview={phase.preview} {...review} />
        </div>
      );
  }
}

function Progress({ label }: Readonly<{ label: string }>) {
  return (
    <output aria-live="polite" className="grid gap-3">
      <span className="flex items-center gap-2 font-bold text-[#1a1a1a]">
        <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={2.4} />
        {label}
      </span>
      <span aria-hidden className="relative block h-2.5 overflow-hidden border-2 border-[#1a1a1a] bg-white">
        <span className="absolute inset-y-0 left-0 w-2/5 animate-pulse bg-[#1a1a1a]" />
      </span>
    </output>
  );
}

function SaveError({ error }: Readonly<{ error: string | null }>) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-2.5 border-2 border-[#c0392b] bg-white px-4 py-3 text-sm leading-6" role="alert">
      <ServerCrash aria-hidden className="mt-1 size-4 shrink-0 text-[#c0392b]" strokeWidth={2.4} />
      <p className="font-bold text-[#c0392b]">{error}</p>
    </div>
  );
}

type WizardFooterProps = {
  acknowledged: boolean;
  createLines: ReadonlySet<number>;
  onClose: () => void;
  onCommit: (preview: ProductImportPreview) => void;
  onPhase: (phase: WizardPhase) => void;
  phase: WizardPhase;
};

function WizardFooter({ acknowledged, createLines, onClose, onCommit, onPhase, phase }: Readonly<WizardFooterProps>) {
  if (phase.kind === "reading" || phase.kind === "saving") return null;
  if (phase.kind === "file-error") {
    return (
      <FooterBar>
        <button className={SECONDARY} onClick={() => downloadCsv("modelo-importacao-produtos.csv", productImportTemplateCsv())} type="button">
          <FileDown aria-hidden className="size-4" strokeWidth={2.4} />
          Baixar modelo CSV
        </button>
        <PrimaryButton onClick={onClose}>Trocar arquivo</PrimaryButton>
      </FooterBar>
    );
  }
  if (phase.kind === "done") return <DoneFooter createLines={createLines} onClose={onClose} preview={phase.preview} result={phase.result} />;
  return (
    <ReviewFooter
      acknowledged={acknowledged}
      createLines={createLines}
      onClose={onClose}
      onCommit={onCommit}
      onConfirming={(confirming) => onPhase({ ...phase, confirming, error: null })}
      phase={phase}
    />
  );
}

function FooterBar({ children, highlight = false }: Readonly<{ children: React.ReactNode; highlight?: boolean }>) {
  return (
    <footer className={["flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t-2 border-[#1a1a1a] px-5 py-3.5", highlight ? "bg-brand-yellow" : "bg-[#f7f2e7]"].join(" ")}>
      {children}
    </footer>
  );
}

function ErrorReportButton({ createLines, preview }: Readonly<{ createLines: ReadonlySet<number>; preview: ProductImportPreview }>) {
  const leftOut = preview.rows.length - productImportCounts(preview.rows, createLines).entram;
  return (
    <button
      className={[GHOST, "mr-auto"].join(" ")}
      disabled={leftOut === 0}
      onClick={() => downloadCsv(errorReportName(preview.fileName), productImportErrorReportCsv(preview, createLines))}
      type="button"
    >
      <FileDown aria-hidden className="size-4" strokeWidth={2.4} />
      Relatório de erros
    </button>
  );
}

type ReviewFooterProps = {
  acknowledged: boolean;
  createLines: ReadonlySet<number>;
  onClose: () => void;
  onCommit: (preview: ProductImportPreview) => void;
  onConfirming: (confirming: boolean) => void;
  phase: Extract<WizardPhase, { kind: "review" }>;
};

function ReviewFooter({ acknowledged, createLines, onClose, onCommit, onConfirming, phase }: Readonly<ReviewFooterProps>) {
  const counts = productImportCounts(phase.preview.rows, createLines);
  const products = counts.entram === 1 ? "1 produto" : `${counts.entram} produtos`;

  if (phase.expired) {
    return (
      <FooterBar>
        <PrimaryButton onClick={onClose}>Enviar a planilha de novo</PrimaryButton>
      </FooterBar>
    );
  }
  if (phase.confirming) {
    const incomplete = counts.incompletosEntram > 0 ? ` ${counts.incompletosEntram} sem peso ou medidas.` : "";
    return (
      <FooterBar highlight>
        <p className="mr-auto min-w-60 flex-1 text-sm font-bold leading-6 text-[#1a1a1a]">
          Cadastrar {products} como rascunho?{incomplete} Esta ação cria itens no catálogo.
        </p>
        <button className={SECONDARY} onClick={() => onConfirming(false)} type="button">
          Voltar
        </button>
        <PrimaryButton onClick={() => onCommit(phase.preview)}>Confirmar cadastro</PrimaryButton>
      </FooterBar>
    );
  }
  const blocked = counts.entram === 0 || (phase.preview.alreadyImported !== null && !acknowledged);
  return (
    <FooterBar>
      <ErrorReportButton createLines={createLines} preview={phase.preview} />
      <button className={SECONDARY} onClick={onClose} type="button">
        Cancelar
      </button>
      <PrimaryButton disabled={blocked} onClick={() => onConfirming(true)}>
        Cadastrar {products}
      </PrimaryButton>
    </FooterBar>
  );
}

type DoneFooterProps = {
  createLines: ReadonlySet<number>;
  onClose: () => void;
  preview: ProductImportPreview;
  result: ProductImportResult;
};

function DoneFooter({ createLines, onClose, preview, result }: Readonly<DoneFooterProps>) {
  return (
    <FooterBar>
      {result.errors.length + result.ignored.length > 0 ? <ErrorReportButton createLines={createLines} preview={preview} /> : null}
      <button className={SECONDARY} onClick={onClose} type="button">
        Importar outra planilha
      </button>
      <Link className={["inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500]", FOCUS_RING].join(" ")} href="/admin/products">
        Ver em Produtos
      </Link>
    </FooterBar>
  );
}
