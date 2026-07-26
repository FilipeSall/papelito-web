export type ProductAvailabilityStatus =
  | "idle"
  | "loading"
  | "ok"
  | "not_applicable"
  | "missing_cep"
  | "no_vendor"
  | "unavailable";

export interface ProductAvailabilityEntry {
  available: boolean;
  stockQty?: number;
}

export interface ProductAvailabilityResponse {
  status: Exclude<ProductAvailabilityStatus, "idle" | "loading">;
  products: Record<string, ProductAvailabilityEntry>;
}
