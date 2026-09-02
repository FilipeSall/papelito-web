"use client";

import { useState } from "react";

export type DateRange = { from: string; to: string };

/**
 * Intervalo local que acompanha o filtro global em mão única.
 *
 * O filtro da página inicializa e sobrescreve o local; mudar o local nunca volta
 * para a página. Como o estado nasce das props e é reajustado quando elas mudam,
 * um F5 ou uma nova entrada sempre começam do filtro global — nenhum override
 * sobrevive à remontagem.
 */
export function useSyncedDateRange(from: string, to: string) {
  const [range, setRange] = useState<DateRange>({ from, to });
  const [syncedWith, setSyncedWith] = useState<DateRange>({ from, to });

  if (syncedWith.from !== from || syncedWith.to !== to) {
    setSyncedWith({ from, to });
    setRange({ from, to });
  }

  const isOverridden = range.from !== from || range.to !== to;

  return {
    isOverridden,
    range,
    reset: () => setRange({ from, to }),
    setRange,
  };
}
