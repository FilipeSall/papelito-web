export type StockLabelTone = "ok" | "warning" | "critical";

export interface StockLabel {
  text: string;
  tone: StockLabelTone;
}

export function getStockLabel(qty: number): StockLabel {
  if (!Number.isFinite(qty) || qty <= 0) {
    return { text: "Sem estoque", tone: "critical" };
  }

  if (qty <= 3) {
    return { text: `Últimas ${qty}`, tone: "critical" };
  }

  if (qty <= 5) {
    return { text: "Poucas unidades", tone: "warning" };
  }

  return { text: "Em estoque", tone: "ok" };
}
