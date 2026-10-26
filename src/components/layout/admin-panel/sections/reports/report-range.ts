/** Intervalo de datas em ISO (`AAAA-MM-DD`), como as rotas de exportação recebem. */
export type ReportRange = { from: string; to: string };

/** Atalhos de período da exportação; `custom` é o intervalo digitado. */
export const REPORT_PRESETS = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "month", label: "Mês atual" },
  { key: "previous-month", label: "Mês anterior" },
  { key: "custom", label: "Personalizado" },
] as const;

/** Chave de um atalho de período. */
export type ReportPreset = (typeof REPORT_PRESETS)[number]["key"];

const SAO_PAULO_DATE = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
  year: "numeric",
});

/**
 * Data de hoje em São Paulo, no formato ISO. O relógio do navegador pode estar em outro fuso,
 * e o WordPress recorta pelo dia de Brasília.
 */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return SAO_PAULO_DATE.format(now);
}

function shiftDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Intervalo do atalho, terminando hoje (ou no último dia do mês anterior). */
export function presetRange(preset: Exclude<ReportPreset, "custom">, today: string): ReportRange {
  switch (preset) {
    case "7d":
      return { from: shiftDays(today, -6), to: today };
    case "month":
      return { from: monthStart(today), to: today };
    case "previous-month": {
      const lastDay = shiftDays(monthStart(today), -1);
      return { from: monthStart(lastDay), to: lastDay };
    }
    default:
      return { from: shiftDays(today, -29), to: today };
  }
}

/** Atalho que gera exatamente este intervalo, ou `custom` quando nenhum gera. */
export function presetOf(range: ReportRange, today: string): ReportPreset {
  const match = REPORT_PRESETS.find((preset) => {
    if (preset.key === "custom") return false;
    const candidate = presetRange(preset.key, today);
    return candidate.from === range.from && candidate.to === range.to;
  });
  return match?.key ?? "custom";
}

/** Problema do intervalo digitado, ou `null` quando ele pode ir ao servidor. */
export function rangeError(range: ReportRange, today: string): string | null {
  if (!range.from || !range.to) return "Informe as duas datas.";
  if (range.from > range.to) return "A data inicial vem depois da final.";
  if (range.to > today) return "A data final não pode passar de hoje.";
  return null;
}

function brazilianDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/** Intervalo por extenso, como aparece na tela: `26/09/2026 a 25/10/2026`. */
export function formatReportRange(range: ReportRange): string {
  return `${brazilianDate(range.from)} a ${brazilianDate(range.to)}`;
}
