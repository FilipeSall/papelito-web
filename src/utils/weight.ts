export function hasPositiveWeight(weight: string | null | undefined) {
  if (!weight) {
    return false;
  }

  const normalized = weight.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0;
}
