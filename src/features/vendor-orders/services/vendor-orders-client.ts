import type { VendorOrdersFilters, VendorOrdersSnapshot } from "../types/vendor-orders";
import { buildVendorOrdersQueryString } from "../utils/vendor-order-filters";

export async function fetchVendorOrders(filters: VendorOrdersFilters): Promise<VendorOrdersSnapshot> {
  const query = buildVendorOrdersQueryString(filters);
  const response = await fetch(`/api/vendor/orders?${query}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const body = (await response.json().catch(() => null)) as
    | VendorOrdersSnapshot
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(body && typeof body === "object" && "message" in body && typeof body.message === "string"
      ? body.message
      : "Não foi possível carregar os pedidos.");
  }

  return body as VendorOrdersSnapshot;
}
