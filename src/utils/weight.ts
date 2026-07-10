function parsePositiveMeasure(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0;
}

export function hasPositiveWeight(weight: string | null | undefined) {
  return parsePositiveMeasure(weight);
}

export function hasPositiveDimension(dimension: string | null | undefined) {
  return parsePositiveMeasure(dimension);
}
