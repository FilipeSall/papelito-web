/** Slug da categoria Papelito; `todos` é a única opção reservada da UI. */
export type ProductTypeId = string;

export type ProductCollectionId =
  | "todos"
  | "premium"
  | "novidades"
  | "promocoes"
  | "kits";

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
  isPremium: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  isKit: boolean;
  /** Slugs das subcategorias da taxonomia Papelito. Vazio antes da classificacao. */
  subcategories: string[];
  promotionContext?: string;
  bestVendor?: CatalogBestVendor;
}

export interface ProductsCatalogTab {
  id: ProductTypeId;
  label: string;
  count: number;
}

export interface ProductsCatalogPayload {
  items: ProductsCatalogItem[];
  tabs: ProductsCatalogTab[];
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
