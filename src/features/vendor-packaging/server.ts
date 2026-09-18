/**
 * Serviço server-side para carregar os dados da página de cubagem.
 */
export { getVendorPackaging } from "./services/get-vendor-packaging";
export {
  getPackagingPhysicalGap,
  type PackagingPhysicalDataGap,
} from "./services/get-packaging-physical-gap";
export type {
  VendorPackagingCatalogItem,
  VendorPackagingDraft,
  VendorPackagingPayload,
  VendorPackagingProfile,
  VendorPackagingSnapshot,
  VendorPackagingSource,
} from "./types/vendor-packaging";
