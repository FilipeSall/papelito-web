export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) {
    return "n/a";
  }

  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTimeLabel(value: string) {
  if (!value) {
    return "Data indisponível";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatOrderStatusLabel(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return "desconhecido";
  }

  return (
    {
      cancelled: "cancelado",
      completed: "concluido",
      failed: "falhou",
      "on-hold": "em espera",
      on_hold: "em espera",
      pending: "pendente",
      processing: "processando",
      refunded: "reembolsado",
    }[normalized] ?? normalized.replace(/-/g, " ").replace(/_/g, " ")
  );
}

export function niceMax(value: number) {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / Math.pow(10, exponent);
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * Math.pow(10, exponent);
}
