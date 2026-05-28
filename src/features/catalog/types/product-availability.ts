export type ProductAvailabilityStatus =
  | "idle"
  | "loading"
  | "ok"
  | "not_applicable"
  | "unavailable";

export interface ProductAvailabilityEntry {
  available: boolean;
}

export interface ProductAvailabilityResponse {
  status: Exclude<ProductAvailabilityStatus, "idle" | "loading">;
  products: Record<string, ProductAvailabilityEntry>;
}
