"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import type {
  SkuImportPreview as SkuImportPreviewData,
  SkuImportResult as SkuImportResultData,
} from "@/features/vendor-sku-import/types/vendor-sku-import";
import {
  confirmSkuImport,
  previewSkuImport,
} from "@/features/vendor-sku-import/services/vendor-sku-import-client";
import {
  buildSkuImportConfirmRows,
  initialSkuImportDecisions,
  selectedSkuImportFamily,
  skuImportFailureFeedback,
  skuImportOptions,
  skuImportResultFeedback,
  type SkuImportDecisions,
  type SkuImportFeedback,
} from "@/features/vendor-sku-import/utils/sku-import-decisions";

import { FeedbackBanner } from "./feedback-banner";
import { SkuImportDropzone, skuImportFileError } from "./sku-import-dropzone";
import { SkuImportPreview } from "./sku-import-preview";
import { SkuImportResult } from "./sku-import-result";

type Phase =
  | { kind: "select" }
  | { kind: "processing" }
  | { kind: "preview"; preview: SkuImportPreviewData; applying: boolean }
  | { kind: "result"; result: SkuImportResultData; ignored: number };

const BUTTON_PRIMARY = [
  "inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
  FOCUS_RING,
].join(" ");

const BUTTON_SECONDARY = [
  "inline-flex h-11 items-center border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow",
  FOCUS_RING,
].join(" ");

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function ignoredCount(preview: SkuImportPreviewData, decisions: SkuImportDecisions) {
  return preview.rows.filter(
    (row) => skuImportOptions(row).length > 0 && selectedSkuImportFamily(row, decisions) === null,
  ).length;
}

type SkuImportPanelProps = {
  /** Fecha o modal. */
  onClose: () => void;
  /** Recebe a mensagem final para o banner da página e dispara a atualização da listagem. */
  onFinished: (feedback: SkuImportFeedback) => void;
};

/**
 * Fluxo de importação: arquivo → prévia (sem gravação) → confirmação → resultado.
 * O erro diz em que etapa aconteceu — leitura do arquivo, associação ou gravação.
 */
export function SkuImportPanel({ onClose, onFinished }: Readonly<SkuImportPanelProps>) {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "select" });
  const [decisions, setDecisions] = useState<SkuImportDecisions>({});
  const [failure, setFailure] = useState<SkuImportFeedback | null>(null);

  function chooseFile(chosen: File) {
    const problem = skuImportFileError(chosen);
    setFailure(problem ? skuImportFailureFeedback("read", problem) : null);
    setFile(problem ? null : chosen);
  }

  async function processFile() {
    if (!file) return;
    setFailure(null);
    setPhase({ kind: "processing" });
    try {
      const preview = await previewSkuImport(file);
      setDecisions(initialSkuImportDecisions(preview.rows));
      setPhase({ kind: "preview", preview, applying: false });
    } catch (error) {
      setFailure(skuImportFailureFeedback("read", errorMessage(error, "Não foi possível ler a planilha.")));
      setPhase({ kind: "select" });
    }
  }

  async function apply(preview: SkuImportPreviewData) {
    const rows = buildSkuImportConfirmRows(preview.rows, decisions);
    if (rows.length === 0) return;
    setFailure(null);
    setPhase({ kind: "preview", preview, applying: true });
    try {
      const result = await confirmSkuImport(rows);
      setPhase({ kind: "result", result, ignored: ignoredCount(preview, decisions) });
      onFinished(skuImportResultFeedback(result));
    } catch (error) {
      setFailure(skuImportFailureFeedback("persist", errorMessage(error, "Nenhuma alteração foi salva.")));
      setPhase({ kind: "preview", preview, applying: false });
    }
  }

  function restart() {
    setFile(null);
    setFailure(null);
    setDecisions({});
    setPhase({ kind: "select" });
  }

  return (
    <div className="space-y-4">
      <FeedbackBanner feedback={failure} />
      <SkuImportPhaseView
        decisions={decisions}
        file={file}
        onApply={apply}
        onChooseFile={chooseFile}
        onClose={onClose}
        onDecide={(line, familyId) => setDecisions((current) => ({ ...current, [line]: familyId }))}
        onProcess={processFile}
        onRestart={restart}
        phase={phase}
      />
    </div>
  );
}

type SkuImportPhaseViewProps = {
  decisions: SkuImportDecisions;
  file: File | null;
  phase: Phase;
  onApply: (preview: SkuImportPreviewData) => void;
  onChooseFile: (file: File) => void;
  onClose: () => void;
  onDecide: (line: number, familyId: number | null) => void;
  onProcess: () => void;
  onRestart: () => void;
};

function SkuImportPhaseView(props: Readonly<SkuImportPhaseViewProps>) {
  const { phase } = props;
  if (phase.kind === "preview") {
    return (
      <SkuImportPreview
        applying={phase.applying}
        decisions={props.decisions}
        onApply={() => props.onApply(phase.preview)}
        onBack={props.onRestart}
        onDecide={props.onDecide}
        preview={phase.preview}
      />
    );
  }
  if (phase.kind === "result") {
    return (
      <div className="space-y-4">
        <SkuImportResult ignored={phase.ignored} result={phase.result} />
        <div className="flex flex-wrap gap-3 border-t-2 border-[#1a1a1a] pt-4">
          <button className={BUTTON_PRIMARY} onClick={props.onClose} type="button">Concluir</button>
          <button className={BUTTON_SECONDARY} onClick={props.onRestart} type="button">Importar outra planilha</button>
        </div>
      </div>
    );
  }
  const processing = phase.kind === "processing";
  return (
    <div className="space-y-4">
      <SkuImportDropzone disabled={processing} file={props.file} onFile={props.onChooseFile} />
      <p className="text-xs leading-5 text-[#231f20]/62">
        O código da planilha substitui o SKU que você vê no estoque, sem alterar o SKU da Papelito. Antes de gravar,
        você confere cada associação.
      </p>
      <button className={BUTTON_PRIMARY} disabled={!props.file || processing} onClick={props.onProcess} type="button">
        {processing ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {processing ? "Processando planilha…" : "Ver prévia"}
      </button>
    </div>
  );
}
