export type PaginationSlot = number | "gap-start" | "gap-end";

/** Primeira, última, a atual e um vizinho de cada lado — sete fatias no máximo. */
const MAX_SLOTS = 7;
const EDGE_RUN = 5;

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/**
 * Fatias da paginação numerada. Até sete páginas mostra todas; acima disso mantém sempre a
 * primeira e a última e abre reticências no vão, para a largura da barra não oscilar.
 */
export function buildPaginationRange(
  currentPage: number,
  totalPages: number,
): PaginationSlot[] {
  const total = Math.max(Math.trunc(totalPages) || 1, 1);
  const current = Math.min(Math.max(Math.trunc(currentPage) || 1, 1), total);

  if (total <= MAX_SLOTS) {
    return range(1, total);
  }

  if (current <= EDGE_RUN - 1) {
    return [...range(1, EDGE_RUN), "gap-end", total];
  }

  if (current >= total - (EDGE_RUN - 2)) {
    return [1, "gap-start", ...range(total - (EDGE_RUN - 1), total)];
  }

  return [1, "gap-start", current - 1, current, current + 1, "gap-end", total];
}
