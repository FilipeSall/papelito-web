/** Slug da categoria Papelito; `todos` é a única opção reservada da UI. */
export type ProductTypeId = string;

/**
 * Slug de coleção. `todos` é a pseudo-coleção da UI; `novidades` e `promocoes`
 * são derivadas, calculadas em runtime; o resto vem do catálogo de coleções
 * manuais, que o admin cria sem passar por deploy — por isso não é union fechado.
 */
export type ProductCollectionId = string;

export interface CatalogBestVendor {
  vendorId: number;
  storeName: string;
  city: string;
  state: string;
  distanceKm: number;
  qty: number;
  leadTimeDays: number;
}

export type CatalogCoverageStatus =
  | "not_requested"
  | "applied"
  | "unavailable";

/**
 * Origem do catálogo respondeu (`ok`) ou está indisponível (`unavailable`).
 *
 * Sem isso, falha de transporte no WPGraphQL chega à UI como catálogo vazio e o cliente lê
 * "Nenhum produto encontrado." durante uma indisponibilidade.
 */
export type CatalogSourceStatus = "ok" | "unavailable";

export interface ProductsCatalogItem {
  id: string;
  category: string;
  name: string;
  badge: string;
  originalPrice: number;
  price: number;
  rating: number;
  reviews: number;
  image?: string;
  type: Exclude<ProductTypeId, "todos">;
  /** Coleções manuais às quais o produto pertence, vindas de `papelitoCollections`. */
  collections: string[];
  isPremium: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  isKit: boolean;
  /** Slugs das subcategorias da taxonomia Papelito. Vazio antes da classificacao. */
  subcategories: string[];
  /** Publicação do produto, com offset. Ausente quando a origem não informa data. */
  publishedAt?: string | null;
  promotionContext?: string;
  bestVendor?: CatalogBestVendor;
}

/**
 * Números reais das coleções, para os textos auxiliares da navegação da home.
 *
 * Sai do mesmo catálogo que as páginas de coleção listam, então "disponível" aqui é
 * exatamente o que `isCatalogProductVisible` já define — não uma segunda regra.
 */
export interface ProductsCollectionsSummary {
  kitsCount: number;
  promotionsMaxDiscountPercent: number;
}

/** Subcategoria da taxonomia Papelito, no recorte que a vitrine precisa. */
export interface ProductsCatalogSubcategory {
  slug: string;
  name: string;
  /** Agrupador da subcategoria. Filtro aplica OR dentro da faceta e AND entre facetas. */
  facet: string;
}

/**
 * Categoria com a árvore de subcategorias, para a UI montar o filtro hierárquico.
 *
 * Vem da taxonomia Papelito, não de uma lista no bundle: subcategoria nasce no
 * banco e não pode exigir deploy para aparecer no filtro.
 */
export interface ProductsCatalogCategory {
  slug: string;
  name: string;
  subcategories: ProductsCatalogSubcategory[];
}

export interface ProductsCatalogTab {
  id: ProductTypeId;
  label: string;
  count: number;
}

export interface ProductsCatalogPayload {
  items: ProductsCatalogItem[];
  tabs: ProductsCatalogTab[];
  categories: ProductsCatalogCategory[];
  selectedTypes: Exclude<ProductTypeId, "todos">[];
  minPrice: number | null;
  maxPrice: number | null;
  activeType: ProductTypeId;
  activeCollection: ProductCollectionId;
  selectedSubcategories: string[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  coverageCep: string | null;
  coverageStatus: CatalogCoverageStatus;
  sourceStatus: CatalogSourceStatus;
}
