export const CATALOG_FEATURE_KEY = "catalog";

export { useHomeProducts } from "./hooks/use-home-products";
export { useProductDetail } from "./hooks/use-product-detail";
export {
  ProductAvailabilityProvider,
  useProductAvailability,
} from "./hooks/use-product-availability";
export { useProductsCatalog } from "./hooks/use-products-catalog";
export type {
  HomeFlashSaleCampaign,
  HomeNewArrivalProduct,
  HomeProductCard,
  HomeProductsPayload,
} from "./types/home-products";
export type {
  CatalogBestVendor,
  CatalogCoverageStatus,
  CatalogSourceStatus,
  ProductCollectionId,
  ProductTypeId,
  ProductsCatalogItem,
  ProductsCatalogPayload,
  ProductsCatalogTab,
  ProductsCollectionsSummary,
} from "./types/products-catalog";
export type {
  ProductAvailabilityEntry,
  ProductAvailabilityResponse,
  ProductAvailabilityStatus,
} from "./types/product-availability";
export type { ProductDetailItem } from "./types/product-detail";
