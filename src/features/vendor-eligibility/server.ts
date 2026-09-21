/**
 * Serviço server-side do veredito de elegibilidade do vendor.
 */
export { getVendorEligibility } from "./services/get-vendor-eligibility";
export type {
  VendorEligibility,
  VendorEligibilityRequirement,
  VendorRequirementId,
} from "./types/vendor-eligibility";
export {
  groupBlockingByNavHref,
  readVendorPendencies,
  VENDOR_REQUIREMENT_HREF,
  VENDOR_REQUIREMENT_NAV_HREF,
  type VendorPendingItem,
} from "./utils/vendor-eligibility";
