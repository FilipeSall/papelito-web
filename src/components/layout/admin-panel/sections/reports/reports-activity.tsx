import { Download, Upload } from "lucide-react";

import type { ReportOperation } from "@/types/admin-report-operations";

import { StatusChip } from "../../primitives";
import { pluralize } from "./export-report-config";
import { formatReportRange } from "./report-range";
import { operationStatus } from "./report-status";

const WHEN = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

function operationTitle(operation: ReportOperation): string {
  return operation.kind === "import" ? `Importação · ${operation.title}` : `Exportação · ${operation.title}`;
}

function operationDetail(operation: ReportOperation): string {
  if (operation.kind === "import") {
    const lot = operation.lot ? `Lote ${operation.lot} · ` : "";
    return `${lot}${pluralize(operation.rows, ["linha", "linhas"])} · ${pluralize(operation.created, ["cadastrado", "cadastrados"])} · ${operation.errors} com erro`;
  }
  const { format, from, to } = operation.params;
  const range = from && to ? formatReportRange({ from, to }) : "";
  const rows = operation.status === "done" ? pluralize(operation.rows, ["linha", "linhas"]) : "";
  return [range, format?.toUpperCase() ?? "", rows].filter(Boolean).join(" · ");
}

/**
 * Últimas exportações e lotes de importação, de qualquer admin. Registra parâmetros e
 * contagens, nunca o conteúdo exportado. A lista vem do WordPress já ordenada.
 */
export function ReportsActivity({ operations }: Readonly<{ operations: ReportOperation[] }>) {
  return (
    <section aria-labelledby="reports-activity" className="mr-2 border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a] px-5 py-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55" id="reports-activity">
          Atividade recente
        </h2>
        <p className="text-xs text-[#231f20]/64">Exportações e lotes feitos por qualquer admin</p>
      </div>
      <ActivityList operations={operations} />
    </section>
  );
}

function ActivityList({ operations }: Readonly<{ operations: ReportOperation[] }>) {
  if (operations.length === 0) {
    return (
      <div className="m-5 border-2 border-dashed border-[#1a1a1a] bg-[#faf8f2] px-6 py-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">Nada por aqui ainda</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#231f20]/64">
          Cada exportação e cada lote de produtos aparece aqui, com quem fez e o resultado.
        </p>
      </div>
    );
  }
  return (
    <ul className="divide-y-2 divide-[#1a1a1a]/10">
      {operations.map((operation) => (
        <ActivityItem key={operation.id} operation={operation} />
      ))}
    </ul>
  );
}

function ActivityItem({ operation }: Readonly<{ operation: ReportOperation }>) {
  const Icon = operation.kind === "import" ? Upload : Download;
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-white">
      <span className="grid size-9 shrink-0 place-items-center border-2 border-[#1a1a1a] bg-white">
        <Icon aria-hidden className="size-4" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[#1a1a1a]">{operationTitle(operation)}</p>
        <p className="text-xs leading-5 text-[#231f20]/66" data-numeric>
          {operationDetail(operation)}
        </p>
        {operation.error ? <p className="text-xs font-semibold text-[#c0392b]">⚠ {operation.error}</p> : null}
      </div>
      <p className="hidden text-right font-(family-name:--font-admin-mono) text-xs text-[#1a1a1a]/60 sm:block" data-numeric>
        {WHEN.format(new Date(operation.at))}
        <span className="block text-[11px]">{operation.byName}</span>
      </p>
      <StatusChip compact {...operationStatus(operation.status)} />
    </li>
  );
}
