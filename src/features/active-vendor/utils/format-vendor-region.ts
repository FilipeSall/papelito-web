export function formatVendorRegion(city: string | null | undefined, state: string | null | undefined) {
  const c = (city ?? "").trim();
  const s = (state ?? "").trim();

  if (c && s) return `${c} / ${s}`;
  return c || s;
}

export function formatDistanceKm(distanceKm: number | null | undefined): string | null {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(distanceKm)) {
    return null;
  }

  if (distanceKm < 1) {
    return "Menos de 1 km";
  }

  return `${distanceKm.toFixed(distanceKm >= 10 ? 0 : 1)} km`;
}

export function formatLeadTime(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return "Prazo indefinido";
  if (days === 1) return "Entrega em 1 dia útil";
  return `Entrega em ${days} dias úteis`;
}
