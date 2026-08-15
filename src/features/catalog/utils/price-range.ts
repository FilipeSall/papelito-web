export type PriceRange =
  | { kind: "empty"; minPrice: null; maxPrice: null; rawMinimum: null; rawMaximum: null }
  | { kind: "valid"; minPrice: number | null; maxPrice: number | null; rawMinimum: null; rawMaximum: null }
  | {
      kind: "invalid";
      minPrice: null;
      maxPrice: null;
      /** O que o usuário digitou. Sem isto o erro fica órfão: os campos voltam vazios. */
      rawMinimum: string | null;
      rawMaximum: string | null;
      message: string;
    };

export const EMPTY_PRICE_RANGE: PriceRange = {
  kind: "empty",
  minPrice: null,
  maxPrice: null,
  rawMinimum: null,
  rawMaximum: null,
};

function parsePrice(value: string | undefined) {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function invalid(
  minimum: string | undefined,
  maximum: string | undefined,
  message: string,
): PriceRange {
  return {
    kind: "invalid",
    minPrice: null,
    maxPrice: null,
    rawMinimum: minimum ?? null,
    rawMaximum: maximum ?? null,
    message,
  };
}

export function resolvePriceRange(minimum: string | undefined, maximum: string | undefined): PriceRange {
  const minPrice = parsePrice(minimum);
  const maxPrice = parsePrice(maximum);

  if (minPrice === null && maxPrice === null) {
    return EMPTY_PRICE_RANGE;
  }

  if (minPrice === undefined || maxPrice === undefined) {
    return invalid(minimum, maximum, "Informe preços iguais ou maiores que zero.");
  }

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return invalid(minimum, maximum, "O preço mínimo não pode ser maior que o preço máximo.");
  }

  return { kind: "valid", minPrice, maxPrice, rawMinimum: null, rawMaximum: null };
}
