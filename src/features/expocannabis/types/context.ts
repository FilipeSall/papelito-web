/** Chave de nível do evento, do menor para o maior. */
export type EventLevelKey = "lojista" | "parceiro" | "pdv_perfeito" | "lenda";

/** Nível do evento com o mínimo de unidades e a porcentagem em pontos-base. */
export type EventLevel = {
  key: EventLevelKey;
  name: string;
  minUnits: number;
  pctBp: number;
};

/** Produto vendável no estande, com preço atual e estoque do vendor do evento. */
export type EventProduct = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  priceCents: number;
  stock: number;
  category: { slug: string; name: string };
  description: string;
  specs: { label: string; value: string }[];
  totalSales: number;
  createdAt: string;
};

/** Kit Premium: os 4 produtos com −15%, calculado no servidor. */
export type EventKit = {
  productIds: number[];
  unitCents: number;
  fullUnitCents: number;
  available: boolean;
};

/** Maquininha do evento; a primeira da lista é a padrão. */
export type EventTerminal = { id: string; label: string };

/** Tudo que o tablet precisa para montar a loja, lido de `GET event/{id}/context`. */
export type EventContext = {
  event: { id: string; name: string; startsAt: string; endsAt: string };
  operator: { name: string; canSupervise: boolean };
  terminals: EventTerminal[];
  levels: EventLevel[];
  kit: EventKit;
  categories: { slug: string; name: string }[];
  products: EventProduct[];
  shelves: { maisVendidos: number[]; premium: number[]; lancamentos: number[] };
};
