import type { ExpoPriceProduct, ExpoPricesSnapshot } from "../types/admin-prices";

/** Ids do Kit Premium nas fixtures da aba ExpoDay. */
export const ADMIN_KIT_IDS = [11792, 11796, 11794, 11798];

/** Piteira Tradicional: produto avulso, fora do kit, sem preço próprio. */
export const ADMIN_PITEIRA_ID = 11800;

/** Dichavador Brilho: produto com preço próprio publicado (R$ 89,00 sobre R$ 94,00). */
export const ADMIN_DICHAVADOR_ID = 11841;

function product(id: number, name: string, slug: string, sitePriceCents: number, eventCents: number | null = null): ExpoPriceProduct {
  const category = { sedas: "Sedas", piteiras: "Piteiras", acessorios: "Acessórios" }[slug] ?? slug;
  return { id, name, imageUrl: "", category: { slug, name: category }, sitePriceCents, eventCents, stock: 10 };
}

/** Snapshot da aba ExpoDay com os preços reais do site em 13/11/2026. */
export function adminPricesSnapshot(overrides: Partial<ExpoPricesSnapshot> = {}): ExpoPricesSnapshot {
  return {
    products: [
      product(11792, "Seda Insane King Size", "sedas", 18020),
      product(11796, "Seda Pink King Size", "sedas", 19195),
      product(11794, "Seda Insane Brown King Size", "sedas", 19195),
      product(11798, "Seda Alfafa King Size", "sedas", 20760),
      product(ADMIN_PITEIRA_ID, "Piteira Tradicional", "piteiras", 6437),
      product(ADMIN_DICHAVADOR_ID, "Dichavador Brilho", "acessorios", 9400, 8900),
    ],
    kit: { productIds: ADMIN_KIT_IDS, unitCents: 65595, fullUnitCents: 77170, available: true, pctOff: 15 },
    version: 3,
    updatedAt: "2026-11-13T12:42:00+00:00",
    updatedBy: "Admin Papelito",
    sales: { orders: 4, units: 62, grossCents: 412350, feeCents: 12370, netCents: 399980, pendingFeeRows: 1 },
    ...overrides,
  };
}
