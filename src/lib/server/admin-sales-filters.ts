import "server-only";

import { resolveSalesInterval, type SalesSeriesInterval } from "@/lib/sales-series";

export type AdminSalesPageSearchParams = Record<string, string | string[] | undefined>;

export type AdminSalesFilters = {
  afterIso: string;
  beforeIso: string;
  from: string;
  interval: SalesSeriesInterval;
  page: number;
  periodLabel: string;
  preset: "7d" | "30d" | "month" | "1y" | "custom";
  perPage: number;
  to: string;
};

const SALES_TIMEZONE = "America/Sao_Paulo";
const DEFAULT_PER_PAGE = 20;

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
    afterIso: `${normalizedFrom}T00:00:00`,
    beforeIso: `${normalizedTo}T23:59:59`,
    periodLabel: `${formatDateToLabel(normalizedFrom)} - ${formatDateToLabel(normalizedTo)}`,
  };
}

export function buildAdminSalesFilterQuery(
  filters: AdminSalesFilters,
  overrides: Partial<Pick<AdminSalesFilters, "from" | "page" | "preset" | "to">> = {},
) {
  const params = new URLSearchParams();
  const preset = overrides.preset ?? filters.preset;
  const from = overrides.from ?? filters.from;
  const to = overrides.to ?? filters.to;
  const page = overrides.page ?? filters.page;

  if (preset && preset !== "custom") {
    params.set("preset", preset);
  } else {
    params.set("from", from);
    params.set("to", to);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}
