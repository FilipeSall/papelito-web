export type ProductTypeId =
  | "todos"
  | "sedas"
  | "piteiras"
  | "filtros"
  | "acessorios";

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
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}
