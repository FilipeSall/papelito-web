/** Converte entrada brasileira ou internacional em centavos sem ponto flutuante persistido. */
export function refundInputToCents(value: string) {
  const compact = value.trim().replace(/\s/g, "");
  if (!compact) return 0;

  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  const decimal = Math.max(lastComma, lastDot);
  const normalized =
    decimal >= 0
      ? `${compact.slice(0, decimal).replace(/[^\d-]/g, "")}.${compact.slice(decimal + 1).replace(/\D/g, "")}`
      : compact.replace(/[^\d-]/g, "");

  return Math.round((Number(normalized) || 0) * 100);
}

export function centsToRefundInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}
