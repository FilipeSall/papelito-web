export type VendorStockFilter = "all" | "with_stock" | "zeroed_only";

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
  isZeroed: boolean;
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
  page: number;
  perPage: number;
  total: number;
};

export type VendorStockFilters = {
  category: number | null;
  /** Slug da coleção curada; `null` é "Todas". */
  collection: string | null;
  filter: VendorStockFilter;
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

export const VENDOR_STOCK_SORTS: VendorStockSort[] = [
  "name_asc",
  "name_desc",
  "qty_desc",
  "qty_asc",
  "updated_desc",
];
