export function formatVendorDateTime(value: string, emptyLabel = "—"): string {
  if (!value) return emptyLabel;
  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  });
}

export function formatVendorCep(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return value || "—";
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
