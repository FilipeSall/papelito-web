/** Produto na aba ExpoDay do admin: preço do site, preço próprio do evento e estoque da Cifal. */
export type ExpoPriceProduct = {
  id: number;
  name: string;
  imageUrl: string;
  category: { slug: string; name: string };
  sitePriceCents: number;
  eventCents: number | null;
  stock: number;
};

/** Kit Premium com o preço já calculado pelo WordPress na versão publicada. */
export type ExpoPriceKit = {
  productIds: number[];
  unitCents: number;
  fullUnitCents: number;
  available: boolean;
  pctOff: number;
};

/**
 * O que o estande já vendeu, pelo ledger de repasse. Valores já descontam estornos; `netCents` é o
 * que vai inteiro para a Cifal e ainda não inclui as cobranças com taxa a conferir.
 */
export type ExpoSales = {
  orders: number;
  units: number;
  grossCents: number;
  feeCents: number;
  netCents: number;
  pendingFeeRows: number;
};

/** Tudo que a aba ExpoDay mostra, numa versão publicada. */
export type ExpoPricesSnapshot = {
  products: ExpoPriceProduct[];
  kit: ExpoPriceKit;
  version: number;
  updatedAt: string;
  updatedBy: string;
  sales: ExpoSales;
};

/**
 * Corpo da publicação. `prices` traz só os preços próprios que ficam; o produto que não aparece
 * volta para o preço do site. `version` é a que o admin abriu: se outra pessoa publicou antes, o
 * WordPress responde 409.
 */
export type ExpoPricesPublishPayload = {
  version: number;
  prices: Record<string, number>;
  kitPctOff: number;
};
