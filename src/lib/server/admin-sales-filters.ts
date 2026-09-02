import "server-only";

import { resolveSalesInterval, type SalesSeriesInterval } from "@/lib/sales-series";

export type AdminSalesPageSearchParams = Record<string, string | string[] | undefined>;

export const ADMIN_SALES_SEGMENTS = ["all", "discounted", "refunded"] as const;

export type AdminSalesSegment = (typeof ADMIN_SALES_SEGMENTS)[number];

export const ADMIN_SALES_SEGMENT_LABELS: Record<AdminSalesSegment, string> = {
  all: "Todas as vendas",
  discounted: "Vendas com desconto",
  refunded: "Reembolsadas / canceladas",
};

export type AdminSalesFilters = {
  afterIso: string;
  beforeIso: string;
  from: string;
  interval: SalesSeriesInterval;
  page: number;
  periodLabel: string;
  preset: "7d" | "30d" | "month" | "1y" | "custom";
  perPage: number;
  segment: AdminSalesSegment;
  to: string;
};

const SALES_TIMEZONE = "America/Sao_Paulo";
const DEFAULT_PER_PAGE = 10;

function firstString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function formatDateToInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SALES_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function formatDateToLabel(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function isValidDateInput(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function shiftDays(baseDate: string, days: number) {
  const date = new Date(`${baseDate}T12:00:00-03:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateToInputValue(date);
}

function startOfMonth(baseDate: string) {
  const [year, month] = baseDate.split("-");

  if (!year || !month) {
    return baseDate;
  }

  return `${year}-${month}-01`;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSegment(value: string | undefined): AdminSalesSegment {
  return ADMIN_SALES_SEGMENTS.includes(value as AdminSalesSegment)
    ? (value as AdminSalesSegment)
    : "all";
}

function normalizePreset(value: string | undefined, hasCustomDates: boolean): AdminSalesFilters["preset"] {
  if (value === "7d" || value === "30d" || value === "month" || value === "1y") {
    return value;
  }

  if (value === "custom") {
    return "custom";
  }

  return hasCustomDates ? "custom" : "30d";
}

function computePresetFrom(preset: AdminSalesFilters["preset"], today: string) {
  switch (preset) {
    case "7d":
      return shiftDays(today, -6);
    case "month":
      return startOfMonth(today);
    case "1y":
      return shiftDays(today, -364);
    case "30d":
    case "custom":
    default:
      return shiftDays(today, -29);
  }
}

function detectMatchingPreset(
  from: string,
  to: string,
  today: string,
): AdminSalesFilters["preset"] | null {
  if (to !== today) {
    return null;
  }

  const candidates: Array<AdminSalesFilters["preset"]> = ["7d", "30d", "month", "1y"];

  for (const candidate of candidates) {
    if (computePresetFrom(candidate, today) === from) {
      return candidate;
    }
  }

  return null;
}

export function parseAdminSalesFilters(
  searchParams: AdminSalesPageSearchParams = {},
): AdminSalesFilters {
  const today = formatDateToInputValue(new Date());
  const rawFrom = firstString(searchParams.from);
  const rawTo = firstString(searchParams.to);
  const hasCustomDates = isValidDateInput(rawFrom) || isValidDateInput(rawTo);
  const preset = normalizePreset(firstString(searchParams.preset), hasCustomDates);
  const isExplicitPreset = preset !== "custom";

  const presetFrom = computePresetFrom(preset, today);
  const from = isExplicitPreset
    ? presetFrom
    : isValidDateInput(rawFrom)
      ? rawFrom
      : presetFrom;
  const to = isExplicitPreset ? today : isValidDateInput(rawTo) ? rawTo : today;

  const normalizedFrom = from <= to ? from : to;
  const normalizedTo = from <= to ? to : from;

  const effectivePreset =
    preset === "custom"
      ? (detectMatchingPreset(normalizedFrom, normalizedTo, today) ?? "custom")
      : preset;

  return {
    preset: effectivePreset,
    from: normalizedFrom,
    to: normalizedTo,
    interval: resolveSalesInterval({
      from: normalizedFrom,
      to: normalizedTo,
      preset: effectivePreset,
    }),
    page: parsePositiveInt(firstString(searchParams.page), 1),
    perPage: DEFAULT_PER_PAGE,
    segment: normalizeSegment(firstString(searchParams.segment)),
    afterIso: `${normalizedFrom}T00:00:00`,
    beforeIso: `${normalizedTo}T23:59:59`,
    periodLabel: `${formatDateToLabel(normalizedFrom)} - ${formatDateToLabel(normalizedTo)}`,
  };
}

/**
 * Janela imediatamente anterior, de mesma duracao — espelha
 * `papelito_admin_reports_previous_window` no WordPress, que e quem calcula os valores.
 */
export function buildPreviousPeriodLabel(from: string, to: string) {
  const start = new Date(`${from}T12:00:00-03:00`);
  const end = new Date(`${to}T12:00:00-03:00`);
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  if (!Number.isFinite(days) || days < 1) {
    return "";
  }

  const previousTo = shiftDays(from, -1);
  const previousFrom = shiftDays(previousTo, -(days - 1));

  return `${formatDateToLabel(previousFrom)} - ${formatDateToLabel(previousTo)}`;
}

export function buildAdminSalesFilterQuery(
  filters: AdminSalesFilters,
  overrides: Partial<
    Pick<AdminSalesFilters, "from" | "page" | "preset" | "segment" | "to">
  > = {},
) {
  const params = new URLSearchParams();
  const preset = overrides.preset ?? filters.preset;
  const from = overrides.from ?? filters.from;
  const to = overrides.to ?? filters.to;
  const page = overrides.page ?? filters.page;
  const segment = overrides.segment ?? filters.segment;

  if (preset && preset !== "custom") {
    params.set("preset", preset);
  } else {
    params.set("from", from);
    params.set("to", to);
  }

  if (segment !== "all") {
    params.set("segment", segment);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}
