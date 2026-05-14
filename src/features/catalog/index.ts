export const CATALOG_FEATURE_KEY = "catalog";

export { useHomeProducts } from "./hooks/use-home-products";
export { useProductDetail } from "./hooks/use-product-detail";
export { useProductsCatalog } from "./hooks/use-products-catalog";
export type {
  HomeFlashSaleCampaign,
  HomeNewArrivalProduct,
  HomeProductCard,
  HomeProductsPayload,
} from "./types/home-products";
export type {
  ProductCollectionId,
  ProductTypeId,
  ProductsCatalogItem,
  ProductsCatalogPayload,
  ProductsCatalogTab,
} from "./types/products-catalog";
export type { ProductDetailItem } from "./types/product-detail";
