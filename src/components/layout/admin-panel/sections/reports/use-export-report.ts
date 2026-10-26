"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import { downloadExport } from "../exports/download-export";
import type { ExportFormat } from "../exports/export-fields";
import type { ExportReportDefinition } from "./export-report-config";
import {
  presetOf,
  presetRange,
  rangeError,
  todayInSaoPaulo,
  type ReportPreset,
  type ReportRange,
} from "./report-range";

/** Andamento do download: só um por vez, e a última resposta fica na tela até o filtro mudar. */
export type ExportRunState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; file: string }
  | { status: "error"; message: string };

function reportQuery(definition: ExportReportDefinition, range: ReportRange, choices: Readonly<Record<string, string>>): URLSearchParams {
  const query = new URLSearchParams(definition.period ? { from: range.from, to: range.to } : {});
  for (const choice of definition.choices) query.set(choice.key, choices[choice.key] ?? choice.options[0]?.value ?? "");
  return query;
}

function initialChoices(definition: ExportReportDefinition): Record<string, string> {
  return Object.fromEntries(definition.choices.map((choice) => [choice.key, choice.options[0]?.value ?? ""]));
}

async function fetchCount(url: string): Promise<number> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as { count?: unknown } | null;
  if (!response.ok || typeof payload?.count !== "number") throw new Error("Contagem indisponível.");
  return payload.count;
}

/**
 * Estado de um relatório na página: período (atalho ou digitado, quando o relatório tem), as
 * escolhas declaradas na definição, o formato, a contagem de linhas que o WordPress devolve para o
 * recorte e o download.
 *
 * `count` é `undefined` enquanto carrega ou quando a contagem falha — nesse caso o download
 * continua liberado, porque a contagem é aviso e não autorização. Depois de baixar, a página é
 * atualizada para a Atividade recente mostrar a exportação.
 */
export function useExportReport(definition: ExportReportDefinition) {
  const router = useRouter();
  const [today] = useState(() => todayInSaoPaulo());
  const [range, setRange] = useState<ReportRange>(() => presetRange("30d", today));
  const [preset, setPreset] = useState<ReportPreset>("30d");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [choices, setChoices] = useState<Record<string, string>>(() => initialChoices(definition));
  const [run, setRun] = useState<ExportRunState>({ status: "idle" });

  const invalidRange = definition.period ? rangeError(range, today) : null;
  const countQuery = useSWR(invalidRange ? null : `${definition.countEndpoint}?${reportQuery(definition, range, choices).toString()}`, fetchCount, {
    revalidateOnFocus: false,
  });

  function choosePreset(next: ReportPreset) {
    setPreset(next);
    if (next !== "custom") setRange(presetRange(next, today));
    setRun({ status: "idle" });
  }

  function changeDate(part: keyof ReportRange, value: string) {
    const next = { ...range, [part]: value };
    setRange(next);
    setPreset(presetOf(next, today));
    setRun({ status: "idle" });
  }

  function choose(key: string, value: string) {
    setChoices((current) => ({ ...current, [key]: value }));
    setRun({ status: "idle" });
  }

  async function submit() {
    if (invalidRange || run.status === "loading") return;
    const query = reportQuery(definition, range, choices);
    query.set("format", format);
    const file = definition.period ? `${definition.filenamePrefix}-${range.from}-a-${range.to}.${format}` : `${definition.filenamePrefix}.${format}`;
    setRun({ status: "loading" });
    try {
      const saved = await downloadExport(`${definition.endpoint}?${query.toString()}`, file);
      setRun({ status: "ready", file: saved });
      router.refresh();
    } catch (error) {
      setRun({ status: "error", message: error instanceof Error ? error.message : "Não foi possível gerar o arquivo." });
    }
  }

  return {
    changeDate,
    choices,
    choose,
    choosePreset,
    count: countQuery.data,
    countFailed: Boolean(countQuery.error),
    format,
    invalidRange,
    preset,
    range,
    run,
    setFormat,
    submit,
  };
}

/** Estado devolvido por `useExportReport`, para os pedaços do bloco receberem inteiro. */
export type ExportReportState = ReturnType<typeof useExportReport>;
