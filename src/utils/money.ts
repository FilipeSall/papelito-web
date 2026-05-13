export function parseMoney(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  let normalized = trimmed.replace(/[^\d,.-]/g, "");

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized =
      normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}
