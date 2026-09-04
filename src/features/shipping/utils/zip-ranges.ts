export type ZipRange = {
  minCep: string;
  maxCep: string;
};

export function normalizeCep(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D+/g, "");

  return digits.length === 8 ? digits : "";
}

/**
 * Espelha `papelito_shipping_cep_allows_free_shipping()`.
 *
 * Lista vazia significa território inteiro; com faixas configuradas, destino desconhecido fica de
 * fora. A decisão final continua sendo do WordPress — isto existe para a interface não prometer um
 * benefício que o cálculo autoritativo vai recusar.
 */
export function isCepWithinRanges(
  cep: string | null | undefined,
  ranges: readonly ZipRange[],
): boolean {
  if (ranges.length === 0) {
    return true;
  }

  const normalized = normalizeCep(cep);

  if (normalized === "") {
    return false;
  }

  const needle = Number(normalized);

  return ranges.some((range) => {
    const min = Number(normalizeCep(range.minCep));
    const max = Number(normalizeCep(range.maxCep));

    return Number.isFinite(min) && Number.isFinite(max) && min <= needle && needle <= max;
  });
}
