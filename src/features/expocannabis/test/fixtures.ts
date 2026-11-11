import type { EventContext } from "../types/context";

export const KIT_PRODUCT_IDS = [101, 102, 103, 104];

export const LOOSE_PRODUCT_ID = 200;

/** Contexto mínimo do evento com os preços do protótipo de 29/10. */
export function buildEventContext(overrides: Partial<EventContext> = {}): EventContext {
  const product = (id: number, name: string, priceCents: number, stock = 50) => ({
    id,
    name,
    slug: `produto-${id}`,
    imageUrl: `https://cdn.test/${id}.jpg`,
    priceCents,
    stock,
    category: { slug: "sedas", name: "Sedas" },
    description: "Descrição",
    specs: [{ label: "Folhas", value: "50" }],
    totalSales: 10,
    createdAt: "2026-10-01T00:00:00+00:00",
  });

  return {
    event: {
      id: "expocannabis-2026",
      name: "ExpoCannabis Brasil 2026",
      startsAt: "2026-11-20T03:00:00+00:00",
      endsAt: "2026-11-23T02:59:59+00:00",
    },
    operator: { name: "Operadora", canSupervise: false },
    levels: [
      { key: "lojista", name: "Lojista", minUnits: 0, pctBp: 0 },
      { key: "parceiro", name: "Parceiro", minUnits: 10, pctBp: 500 },
      { key: "pdv_perfeito", name: "PDV Perfeito", minUnits: 20, pctBp: 800 },
      { key: "lenda", name: "Lenda", minUnits: 40, pctBp: 1200 },
    ],
    kit: { productIds: KIT_PRODUCT_IDS, unitCents: 65595, fullUnitCents: 77170, available: true },
    categories: [{ slug: "sedas", name: "Sedas" }],
    products: [
      product(101, "Insane", 18020),
      product(102, "Pink", 19195),
      product(103, "Insane Brown", 19195),
      product(104, "Alfafa", 20760),
      product(LOOSE_PRODUCT_ID, "Avulso", 11162),
      product(300, "Sem estoque", 5000, 0),
    ],
    shelves: { maisVendidos: [101, 102], premium: KIT_PRODUCT_IDS, lancamentos: [104] },
    ...overrides,
  };
}
