export type SalesSeriesInterval = "day" | "month";

export type SalesSeriesPoint = {
  key?: string;
  label: string;
  tooltipLabel?: string;
  value: number;
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function parseDateParts(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseMonthParts(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00-03:00`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function normalizeBucketKey(rawKey: string, interval: SalesSeriesInterval) {
  const normalized = rawKey.trim();

  if (interval === "month") {
    const monthParts = parseMonthParts(normalized);
    if (monthParts) {
      return normalized;
    }

    const dateParts = parseDateParts(normalized.slice(0, 10));
    if (dateParts) {
      return `${String(dateParts.year).padStart(4, "0")}-${String(dateParts.month).padStart(2, "0")}`;
    }
  }

  const dateParts = parseDateParts(normalized.slice(0, 10));
  if (dateParts) {
    return normalized.slice(0, 10);
  }

  return normalized;
}

export function getSalesRangeLengthInDays(from: string, to: string) {
  const fromDate = new Date(`${from}T12:00:00-03:00`);
  const toDate = new Date(`${to}T12:00:00-03:00`);
  const diffInMs = toDate.getTime() - fromDate.getTime();

  return Math.floor(diffInMs / 86_400_000) + 1;
}

export function resolveSalesInterval({
  from,
  preset,
  to,
}: {
  from: string;
  preset?: "7d" | "30d" | "month" | "1y" | "custom";
  to: string;
}): SalesSeriesInterval {
  if (preset === "month") {
    return "day";
  }

  return getSalesRangeLengthInDays(from, to) <= 30 ? "day" : "month";
}

export function formatSalesSeriesLabel(
  key: string,
  interval: SalesSeriesInterval,
  options?: { includeYear?: boolean },
) {
  if (interval === "month") {
    const parts = parseMonthParts(key);
    if (!parts) {
      return key;
    }

    const monthLabel = MONTH_LABELS[parts.month - 1] ?? key;
    return options?.includeYear ? `${monthLabel}/${String(parts.year).slice(-2)}` : monthLabel;
  }

  const parts = parseDateParts(key);
  if (!parts) {
    return key;
  }

  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}`;
}

export function formatSalesSeriesTooltipLabel(key: string, interval: SalesSeriesInterval) {
  if (interval === "month") {
    const parts = parseMonthParts(key);
    if (!parts) {
      return key;
    }

    const monthLabel = MONTH_LABELS[parts.month - 1] ?? String(parts.month).padStart(2, "0");
    return `${monthLabel}/${parts.year}`;
  }

  const parts = parseDateParts(key);
  if (!parts) {
    return key;
  }

  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

export function buildSalesSeriesKeys(
  from: string,
  to: string,
  interval: SalesSeriesInterval,
) {
  if (interval === "month") {
    const keys: string[] = [];
    const current = `${from.slice(0, 7)}-01`;
    const end = `${to.slice(0, 7)}-01`;
    let cursor = current;

    while (cursor <= end) {
      keys.push(cursor.slice(0, 7));

      const year = Number(cursor.slice(0, 4));
      const month = Number(cursor.slice(5, 7));
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonth = month === 12 ? 1 : month + 1;

      cursor = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
    }

    return keys;
  }

  const keys: string[] = [];
  const totalDays = getSalesRangeLengthInDays(from, to);

  for (let offset = 0; offset < totalDays; offset += 1) {
    keys.push(addDays(from, offset));
  }

  return keys;
}

export function buildSalesSeriesPoints({
  from,
  interval,
  to,
  valuesByKey,
}: {
  from: string;
  interval: SalesSeriesInterval;
  to: string;
  valuesByKey: Map<string, number> | Record<string, number>;
}) {
  const sourceEntries =
    valuesByKey instanceof Map ? Array.from(valuesByKey.entries()) : Object.entries(valuesByKey);
  const normalizedValues = new Map<string, number>();
  const includeYearOnMonthLabels = interval === "month" && from.slice(0, 4) !== to.slice(0, 4);

  for (const [rawKey, rawValue] of sourceEntries) {
    const key = normalizeBucketKey(rawKey, interval);
    if (!key) {
      continue;
    }

    normalizedValues.set(key, (normalizedValues.get(key) ?? 0) + Math.max(0, Number(rawValue) || 0));
  }

  return buildSalesSeriesKeys(from, to, interval).map((key) => ({
    key,
    label: formatSalesSeriesLabel(key, interval, { includeYear: includeYearOnMonthLabels }),
    tooltipLabel: formatSalesSeriesTooltipLabel(key, interval),
    value: normalizedValues.get(key) ?? 0,
  }));
}
