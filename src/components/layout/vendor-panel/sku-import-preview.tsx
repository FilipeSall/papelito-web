"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import type {
  SkuImportPreview as SkuImportPreviewData,
  SkuImportPreviewRow,
  SkuImportStatus,
} from "@/features/vendor-sku-import/types/vendor-sku-import";
import {
  conflictingSkuImportLines,
  pendingSkuImportChanges,
  selectedSkuImportFamily,
  type SkuImportDecisions,
} from "@/features/vendor-sku-import/utils/sku-import-decisions";

import { SkuImportPreviewRowView } from "./sku-import-preview-row";

type PreviewFilter = "all" | "identified" | "review" | "issues" | "up_to_date";

const FILTER_STATUSES: Record<Exclude<PreviewFilter, "all">, readonly SkuImportStatus[]> = {
  identified: ["exact", "synonym"],
  review: ["review", "conflict"],
  issues: ["not_found", "invalid", "duplicate"],
  up_to_date: ["up_to_date"],
};

const FILTER_LABELS: Record<PreviewFilter, string> = {
  all: "Todas",
  identified: "Identificados",
  review: "Revisar",
  issues: "Não processáveis",
  up_to_date: "Já atualizados",
};

const FILTERS = Object.keys(FILTER_LABELS) as PreviewFilter[];

const BUTTON_PRIMARY = [
  "inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
  FOCUS_RING,
].join(" ");

const BUTTON_SECONDARY = [
  "inline-flex h-11 items-center border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

function countFilter(rows: readonly SkuImportPreviewRow[], filter: PreviewFilter) {
  if (filter === "all") return rows.length;
  return rows.filter((row) => FILTER_STATUSES[filter].includes(row.status)).length;
}

function footerMessage(conflicts: number, changes: number) {
  if (conflicts === 1) return "Resolva 1 linha em conflito antes de aplicar.";
  if (conflicts > 1) return `Resolva ${conflicts} linhas em conflito antes de aplicar.`;
  return changes === 1 ? "1 item terá o SKU alterado." : `${changes} itens terão o SKU alterado.`;
}

function changesLabel(count: number) {
  return count === 1 ? "Aplicar 1 alteração" : `Aplicar ${count} alterações`;
}

type SkuImportPreviewProps = {
  /** Envio da confirmação em andamento. */
  applying: boolean;
  /** Escolhas do vendor por linha. */
  decisions: SkuImportDecisions;
  /** Prévia devolvida pelo WordPress. */
  preview: SkuImportPreviewData;
  /** Confirma as linhas aplicadas. */
  onApply: () => void;
  /** Volta para a escolha do arquivo, descartando a prévia. */
  onBack: () => void;
  /** Registra a escolha do vendor para uma linha. */
  onDecide: (line: number, familyId: number | null) => void;
};

/**
 * Prévia obrigatória da importação: nada é gravado até o vendor confirmar.
 * O botão mostra a contagem exata de itens que mudam e fica bloqueado enquanto houver
 * escolha em conflito; linhas incertas começam ignoradas.
 */
export function SkuImportPreview({ applying, decisions, onApply, onBack, onDecide, preview }: Readonly<SkuImportPreviewProps>) {
  const [filter, setFilter] = useState<PreviewFilter>("all");
  const conflicts = useMemo(() => conflictingSkuImportLines(preview.rows, decisions), [preview.rows, decisions]);
  const changes = pendingSkuImportChanges(preview.rows, decisions, conflicts);
  const visible = filter === "all" ? preview.rows : preview.rows.filter((row) => FILTER_STATUSES[filter].includes(row.status));

  return (
    <div className="space-y-4">
      <SkuImportSummary preview={preview} />
      <SkuImportUncertainNotice preview={preview} />

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Filtrar linhas</legend>
        {FILTERS.map((key) => (
          <button
            aria-pressed={filter === key}
            className={[
              "border-2 border-[#1a1a1a] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition",
              filter === key ? "bg-[#1a1a1a] text-brand-yellow" : "bg-white text-[#1a1a1a] hover:bg-brand-yellow",
              FOCUS_RING,
            ].join(" ")}
            key={key}
            onClick={() => setFilter(key)}
            type="button"
          >
            {FILTER_LABELS[key]} · {countFilter(preview.rows, key)}
          </button>
        ))}
      </fieldset>

      <div className="max-h-[50vh] overflow-auto border-2 border-[#1a1a1a] bg-white">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-1 bg-[#faf8f2]">
            <tr>
              {["Linha", "Planilha", "Produto identificado", "SKU atual", "Novo SKU", "Status"].map((header) => (
                <th className="border-b-2 border-[#1a1a1a] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]" key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <SkuImportPreviewRowView
                conflicting={conflicts.has(row.line)}
                key={row.line}
                onDecide={onDecide}
                row={row}
                selected={selectedSkuImportFamily(row, decisions)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#1a1a1a] pt-4">
        <output className="text-sm font-semibold text-[#1a1a1a]">
          {footerMessage(conflicts.size, changes)}
        </output>
        <div className="flex flex-wrap gap-3">
          <button className={BUTTON_SECONDARY} disabled={applying} onClick={onBack} type="button">
            Trocar arquivo
          </button>
          <button className={BUTTON_PRIMARY} disabled={applying || changes === 0 || conflicts.size > 0} onClick={onApply} type="button">
            {applying ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            {applying ? "Aplicando…" : changesLabel(changes)}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkuImportSummary({ preview }: Readonly<{ preview: SkuImportPreviewData }>) {
  const { summary } = preview;
  const facts = [
    { label: "Linhas", value: summary.total },
    { label: "Identificados", value: summary.exact + summary.synonym },
    { label: "Revisar", value: summary.review + summary.conflict },
    { label: "Não encontrados", value: summary.not_found },
    { label: "Com erro", value: summary.invalid + summary.duplicate },
    { label: "Já atualizados", value: summary.up_to_date },
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {facts.map((fact) => (
        <div className="border-2 border-[#1a1a1a] bg-white px-3 py-2" key={fact.label}>
          <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/62">{fact.label}</dt>
          <dd className="mt-1 text-xl font-black text-[#1a1a1a]">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SkuImportUncertainNotice({ preview }: Readonly<{ preview: SkuImportPreviewData }>) {
  const uncertain = preview.summary.review + preview.summary.conflict;
  if (uncertain === 0) return null;
  return (
    <p className="border-2 border-dashed border-[#1a1a1a] bg-brand-yellow/25 px-4 py-3 text-sm leading-6 text-[#1a1a1a]">
      <strong>{uncertain === 1 ? "1 linha precisa" : `${uncertain} linhas precisam`} da sua decisão.</strong>{" "}
      Elas começam ignoradas e só entram na importação se você escolher o produto correto.
    </p>
  );
}
