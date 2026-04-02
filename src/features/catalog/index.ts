export const CATALOG_FEATURE_KEY = "catalog";

export { useHomeProducts } from "./hooks/use-home-products";
export { useProductsCatalog } from "./hooks/use-products-catalog";
export type {
  HomeNewArrivalProduct,
  HomeProductCard,
  HomeProductsPayload,
} from "./types/home-products";
export type {
  ProductTypeId,
  ProductsCatalogItem,
  ProductsCatalogPayload,
  ProductsCatalogTab,
} from "./types/products-catalog";
