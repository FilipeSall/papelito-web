export type VendorStockFilter =
  | "all"
  | "with_stock"
  | "low_stock"
  | "zeroed_only"
  | "unconfigured"
  | "incomplete";

/**
 * Campo que falta no cadastro do produto. São as regras que o WordPress já aplica em outro lugar
 * — preço, peso e dimensão barram a venda, categoria barra a vitrine, imagem cai no fallback —,
 * nunca uma exigência criada no front.
 */
export type VendorStockMissingField =
  | "image"
  | "price"
  | "weight"
  | "dimensions"
  | "category";

/** Situação de um item no estoque do vendor. Nunca representada só por cor. */
export type VendorStockLevel = "available" | "low" | "out" | "unconfigured";

/** Recorte por entidade: Kit é `papelito_kits`, não uma coleção da taxonomia. */
export type VendorStockType = "products" | "kits";

export type VendorStockSort =
  | "name_asc"
  | "name_desc"
  | "qty_desc"
  | "qty_asc"
  | "updated_desc";

export type VendorStockTerm = {
  id: number;
  name: string;
  slug: string;
};

/** Produto que compõe um kit, com o estoque que o vendor tem dele. */
export type VendorStockKitItem = {
  imageUrl: string;
  isZeroed: boolean;
  productId: number;
  productName: string;
  /** Quantidade desse produto consumida por uma unidade do kit. */
  quantity: number;
  qty: number;
  sku: string;
};

/**
 * Composição do kit, como o WordPress a devolve junto da linha do kit.
 *
 * `assemblableQty` é a mesma regra da cobertura (menor `estoque / quantidade`
 * entre os itens), não um segundo cálculo: a linha de estoque do próprio kit não
 * decide disponibilidade.
 */
export type VendorStockKit = {
  assemblableQty: number;
  items: VendorStockKitItem[];
  kitId: number;
  slug: string;
};

export type VendorStockItem = {
  categories: VendorStockTerm[];
  imageUrl: string;
  isPubliclyViewable: boolean;
  /** Vendor nunca lançou saldo desse produto — diferente de ter chegado a zero. */
  isUnconfigured: boolean;
  isZeroed: boolean;
  missingFields: VendorStockMissingField[];
  /** Presente só quando o produto é o produto comercial de um kit. */
  kit: VendorStockKit | null;
  productId: number;
  publicProductId: number;
  productName: string;
  qty: number;
  sku: string;
  tags: VendorStockTerm[];
  updatedAt: string;
};

export type VendorStockSnapshot = {
  items: VendorStockItem[];
  /**
   * Limite de estoque baixo, em unidades, como o WordPress o define.
   *
   * Viaja na resposta em vez de existir como constante no front: duas cópias divergiriam no dia
   * em que o backend mudasse o número, e o selo da linha passaria a discordar do filtro.
   */
  lowStockThreshold: number;
  page: number;
  perPage: number;
  total: number;
};

/**
 * Situação do catálogo inteiro do vendor, não da página.
 *
 * `coveragePercent` é presença no catálogo — `available / eligible` —, nunca participação no
 * volume físico de estoque.
 */
export type VendorStockSummary = {
  available: number;
  coveragePercent: number;
  eligible: number;
  incomplete: number;
  lowStock: number;
  lowStockThreshold: number;
  outOfStock: number;
  unconfigured: number;
};

export type VendorStockFilters = {
  category: number | null;
  /** Slug da coleção curada; `null` é "Todas". */
  collection: string | null;
  filter: VendorStockFilter;
  /**
   * Itens por página. Preferência de visualização, não filtro: viaja na URL junto do recorte para
   * sobreviver à paginação e ao compartilhamento, mas não conta como filtro ativo nem vira ficha.
   */
  perPage: number;
  search: string;
  sort: VendorStockSort;
  tags: number[];
  type: VendorStockType;
};

export type VendorStockTaxonomyTerm = VendorStockTerm & { count: number };

/** Coleção curada. Identificada por slug: não é entidade com id no banco. */
export type VendorStockCollection = {
  count: number;
  name: string;
  slug: string;
};

export type VendorStockTaxonomies = {
  categories: VendorStockTaxonomyTerm[];
  collections: VendorStockCollection[];
  tags: VendorStockTaxonomyTerm[];
};

export const VENDOR_STOCK_TYPES: VendorStockType[] = ["products", "kits"];

/**
 * Tamanhos de página oferecidos ao vendor.
 *
 * O teto é 100 porque é onde `papelito_vendor_stock_query()` corta (`min(100, ...)`): oferecer
 * mais devolveria silenciosamente menos itens do que o rótulo promete.
 */
export const VENDOR_STOCK_PER_PAGE_OPTIONS = [20, 50, 100] as const;

export const VENDOR_STOCK_DEFAULT_PER_PAGE = 20;

/** Valor fora da lista cai no padrão — nunca em um número arbitrário vindo da URL. */
export function parseVendorStockPerPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);

  return VENDOR_STOCK_PER_PAGE_OPTIONS.includes(parsed as (typeof VENDOR_STOCK_PER_PAGE_OPTIONS)[number])
    ? parsed
    : VENDOR_STOCK_DEFAULT_PER_PAGE;
}

export const VENDOR_STOCK_FILTERS: VendorStockFilter[] = [
  "all",
  "with_stock",
  "low_stock",
  "zeroed_only",
  "unconfigured",
  "incomplete",
];

/**
 * Classifica a situação de um item.
 *
 * Kit não tem estoque próprio: quem responde por ele é `assemblableQty`, e por isso um kit nunca
 * aparece como "não configurado" — não existe saldo de kit para o vendor lançar.
 */
export function vendorStockLevel(
  item: Pick<VendorStockItem, "isUnconfigured" | "kit" | "qty">,
  lowStockThreshold: number,
): VendorStockLevel {
  const threshold = Math.max(1, lowStockThreshold);

  if (item.kit) {
    const assemblable = item.kit.assemblableQty;

    if (assemblable <= 0) return "out";

    return assemblable <= threshold ? "low" : "available";
  }

  if (item.isUnconfigured) return "unconfigured";
  if (item.qty <= 0) return "out";

  return item.qty <= threshold ? "low" : "available";
}

export const VENDOR_STOCK_SORTS: VendorStockSort[] = [
  "name_asc",
  "name_desc",
  "qty_desc",
  "qty_asc",
  "updated_desc",
];
