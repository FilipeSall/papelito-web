const CURRENCY = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export function chamadoCurrency(value: number) {
  return CURRENCY.format(Number.isFinite(value) ? value : 0);
}

const DATE = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function chamadoDayLabel(value: string) {
  if (!value) return "";

  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);

  return Number.isNaN(date.getTime()) ? "" : DATE.format(date);
}
