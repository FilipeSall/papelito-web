"use client";

import { CalendarRange, Check, CircleSlash, Download, LoaderCircle, TriangleAlert } from "lucide-react";

import { PrimaryButton } from "../../primitives";
import { EXPORT_FORMATS, ExportChoiceField, ExportDateField } from "../exports/export-fields";
import { pluralize, type ExportChoice, type ExportReportDefinition } from "./export-report-config";
import { formatReportRange, REPORT_PRESETS, type ReportPreset } from "./report-range";
import { useExportReport, type ExportReportState } from "./use-export-report";

type ReportPartProps = {
  /** Relatório descrito pelo bloco. */
  definition: ExportReportDefinition;
  /** Estado de `useExportReport` para este relatório. */
  state: ExportReportState;
};

/**
 * Um relatório exportável: período por atalho ou digitado, papel (só usuários), formato e o
 * número de linhas que sairiam — visível antes do clique, para nunca baixar arquivo vazio sem
 * saber.
 */
export function ExportReportBlock({ definition }: Readonly<{ definition: ExportReportDefinition }>) {
  const state = useExportReport(definition);

  return (
    <div className="grid gap-4 px-5 py-6 md:px-6" data-testid={`export-report-${definition.key}`}>
      <ReportHead definition={definition} state={state} />
      <ReportFilters definition={definition} state={state} />
      <ReportActions definition={definition} state={state} />
      <ReportFeedback definition={definition} state={state} />
      <details className="group">
        <summary className="inline-flex min-h-7 cursor-pointer list-none items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
          <span aria-hidden className="font-(family-name:--font-admin-mono) text-[13px] group-open:hidden">+</span>
          <span aria-hidden className="hidden font-(family-name:--font-admin-mono) text-[13px] group-open:inline">–</span>
          <span>O que vem no arquivo</span>
        </summary>
        <p className="mt-2 text-sm leading-6 text-[#231f20]/72">{definition.columns.join(" · ")}</p>
      </details>
    </div>
  );
}

function ReportHead({ definition, state }: Readonly<ReportPartProps>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-[1_1_16rem]">
        <h3 className="text-[22px] font-semibold uppercase leading-tight tracking-[0.06em] text-[#1a1a1a]" style={{ fontFamily: "var(--font-admin-display)" }}>
          {definition.title}
        </h3>
        <p className="mt-1.5 max-w-[56ch] text-sm leading-6 text-[#231f20]/72">{definition.description}</p>
      </div>
      <ReportCount definition={definition} state={state} />
    </div>
  );
}

function scopeLabel(definition: ExportReportDefinition, state: ExportReportState): string {
  if (definition.period) return state.invalidRange ? "" : formatReportRange(state.range);
  return "no recorte";
}

function ReportCount({ definition, state }: Readonly<ReportPartProps>) {
  const known = typeof state.count === "number" && !state.invalidRange;
  const label = state.count === 1 ? definition.noun[0] : definition.noun[1];

  return (
    <output aria-live="polite" className="grid min-w-28 justify-items-end gap-1 text-right">
      <span className="text-[34px] font-semibold leading-none text-[#1a1a1a]" data-numeric style={{ fontFamily: "var(--font-admin-display)" }}>
        {known ? (state.count ?? 0).toLocaleString("pt-BR") : "—"}
      </span>
      <span className="text-[10px] font-black uppercase leading-5 tracking-[0.18em] text-[#1a1a1a]/62">
        {label}
        <br />
        <span data-numeric>{scopeLabel(definition, state)}</span>
      </span>
    </output>
  );
}

function ReportFilters({ definition, state }: Readonly<ReportPartProps>) {
  return (
    <div className="grid gap-3">
      <ReportPeriod definition={definition} state={state} />
      {definition.choices.map((choice) => (
        <ReportChoice choice={choice} key={choice.key} reportKey={definition.key} state={state} />
      ))}
      <p className="flex items-center gap-2 text-xs leading-5 text-[#231f20]/66">
        <CalendarRange aria-hidden className="size-3.5 shrink-0" strokeWidth={2.4} />
        <span>{definition.period?.note ?? definition.scopeNote}</span>
      </p>
    </div>
  );
}

function ReportPeriod({ definition, state }: Readonly<ReportPartProps>) {
  if (!definition.period) return null;
  return (
    <>
      <ExportChoiceField<ReportPreset>
        label="Período"
        name={`${definition.key}-preset`}
        onChange={state.choosePreset}
        options={REPORT_PRESETS.map((preset) => ({ label: preset.label, value: preset.key }))}
        value={state.preset}
      />
      <ReportDates definition={definition} state={state} />
    </>
  );
}

function ReportDates({ definition, state }: Readonly<ReportPartProps>) {
  if (state.preset !== "custom" || !definition.period) return null;
  return (
    <div className="grid gap-2">
      <div className="grid items-end gap-3 min-[380px]:grid-cols-2 sm:flex sm:gap-4">
        <ExportDateField label={definition.period.labels[0]} onChange={(value) => state.changeDate("from", value)} value={state.range.from} />
        <ExportDateField label={definition.period.labels[1]} onChange={(value) => state.changeDate("to", value)} value={state.range.to} />
      </div>
      {state.invalidRange ? <p className="text-sm font-bold text-[#c0392b]">⚠ {state.invalidRange}</p> : null}
    </div>
  );
}

function ReportChoice({ choice, reportKey, state }: Readonly<{ choice: ExportChoice; reportKey: string; state: ExportReportState }>) {
  return (
    <ExportChoiceField<string>
      label={choice.label}
      name={`${reportKey}-${choice.key}`}
      onChange={(value) => state.choose(choice.key, value)}
      options={choice.options}
      value={state.choices[choice.key] ?? choice.options[0]?.value ?? ""}
    />
  );
}

function submitLabel(definition: ExportReportDefinition, state: ExportReportState): string {
  if (state.run.status === "loading") return "Gerando arquivo…";
  if (typeof state.count !== "number" || state.count === 0 || state.invalidRange) return "Exportar";
  return `Exportar ${pluralize(state.count, definition.noun)}`;
}

function ReportActions({ definition, state }: Readonly<ReportPartProps>) {
  const blocked = Boolean(state.invalidRange) || state.count === 0 || state.run.status === "loading";
  const Icon = state.run.status === "loading" ? LoaderCircle : Download;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <ExportChoiceField label="Formato" name={`${definition.key}-format`} onChange={state.setFormat} options={EXPORT_FORMATS} value={state.format} />
      <PrimaryButton className="w-full justify-center sm:w-auto" disabled={blocked} onClick={() => void state.submit()}>
        <Icon aria-hidden className={["size-4", state.run.status === "loading" ? "animate-spin" : ""].join(" ")} strokeWidth={2.4} />
        {submitLabel(definition, state)}
      </PrimaryButton>
    </div>
  );
}

function emptyMessage(definition: ExportReportDefinition, state: ExportReportState): string {
  if (definition.period) return `${definition.emptyLead} entre ${formatReportRange(state.range)}. Escolha outro período`;
  return `${definition.emptyLead} com esses filtros. Troque a situação ou a categoria`;
}

function ReportFeedback({ definition, state }: Readonly<ReportPartProps>) {
  if (state.invalidRange) return null;
  if (state.count === 0) {
    return (
      <output className="flex items-start gap-2.5 border-2 border-dashed border-[#1a1a1a] bg-[#faf8f2] px-4 py-3 text-sm leading-6 text-[#1a1a1a]">
        <CircleSlash aria-hidden className="mt-1 size-4 shrink-0" strokeWidth={2.4} />
        <span>
          <strong className="font-black">Nada para exportar.</strong> {emptyMessage(definition, state)} — o arquivo sairia só com o
          cabeçalho.
        </span>
      </output>
    );
  }
  return <RunFeedback state={state} />;
}

function RunFeedback({ state }: Readonly<{ state: ExportReportState }>) {
  const { run } = state;
  if (run.status === "ready") {
    return (
      <output className="flex items-start gap-2.5 border-2 border-[#1a1a1a] bg-brand-yellow px-4 py-3 text-sm leading-6 text-[#1a1a1a]">
        <Check aria-hidden className="mt-1 size-4 shrink-0" strokeWidth={2.4} />
        <span>
          <strong className="font-black">Arquivo gerado.</strong> <span className="font-(family-name:--font-admin-mono) text-xs">{run.file}</span> — verifique os
          downloads do navegador.
        </span>
      </output>
    );
  }
  if (run.status === "error") {
    return (
      <p className="flex items-start gap-2.5 border-2 border-[#c0392b] bg-white px-4 py-3 text-sm leading-6 text-[#1a1a1a]" role="alert">
        <TriangleAlert aria-hidden className="mt-1 size-4 shrink-0 text-[#c0392b]" strokeWidth={2.4} />
        <span>
          <strong className="font-black text-[#c0392b]">{run.message}</strong> Nada foi baixado.{" "}
          <button className="border-b-2 border-[#1a1a1a] text-[11px] font-black uppercase tracking-[0.16em] hover:bg-brand-yellow" onClick={() => void state.submit()} type="button">
            Tentar de novo
          </button>
        </span>
      </p>
    );
  }
  if (state.countFailed) {
    return <p className="text-xs leading-5 text-[#231f20]/66">Não foi possível contar os registros agora; a exportação continua disponível.</p>;
  }
  return null;
}
