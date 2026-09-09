import "server-only";

import { wpRest } from "@/lib/server/wp-rest";
import { getSellerAccessToken } from "@/lib/server/vendor-session";

import type { VendorReturn, VendorReturnEvent, VendorReturnStatus } from "../types/vendor-return";

type WpReturnItem = Record<string, unknown>;
type WpReturn = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function count(value: unknown) {
  return Number(value) || 0;
}

function mapItem(raw: WpReturnItem) {
  return {
    id: count(raw.id),
    orderItemId: count(raw.orderItemId),
    productId: count(raw.productId),
    productName: text(raw.productName) || "Produto",
    requestedQty: count(raw.requestedQty),
    receivedQty: raw.receivedQty === null || raw.receivedQty === undefined ? null : count(raw.receivedQty),
    eligibleAmountCents: count(raw.eligibleAmountCents),
    condition: typeof raw.condition === "string" ? raw.condition : null,
    stockDisposition: typeof raw.stockDisposition === "string" ? raw.stockDisposition : null,
  };
}

export function mapVendorReturn(raw: WpReturn): VendorReturn {
  const refund = raw.refund as Record<string, unknown> | null | undefined;
  const items = Array.isArray(raw.items) ? (raw.items as WpReturnItem[]) : [];

  return {
    id: count(raw.id),
    orderId: count(raw.orderId),
    status: (text(raw.status) || "requested") as VendorReturnStatus,
    reason: text(raw.reason),
    reasonOther: text(raw.reasonOther),
    authorizationCode: text(raw.authorizationCode),
    authorizationInstructions: text(raw.authorizationInstructions),
    authorizationExpiresAt: text(raw.authorizationExpiresAt),
    reverseShipmentId: count(raw.reverseShipmentId),
    requestedAt: text(raw.requestedAt),
    receivedAt: text(raw.receivedAt),
    refundDueAt: text(raw.refundDueAt),
    refundedAt: text(raw.refundedAt),
    eligibleAmountCents: count(raw.eligibleAmountCents),
    items: items.map(mapItem),
    refund: refund
      ? {
          amountCents: count(refund.amountCents),
          refundedAt: text(refund.refundedAt),
          method: text(refund.method),
          proofId: count(refund.proofId),
        }
      : null,
  };
}

export async function getVendorReturns(): Promise<VendorReturn[]> {
  const token = await getSellerAccessToken();
  if (!token) return [];

  const result = await wpRest<{ items?: WpReturn[] }>("/papelito/v1/vendor/me/returns", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return result.ok && Array.isArray(result.data.items) ? result.data.items.map(mapVendorReturn) : [];
}

export async function getVendorReturn(returnId: string): Promise<VendorReturn | null> {
  const token = await getSellerAccessToken();
  if (!token) return null;

  const result = await wpRest<WpReturn>(`/papelito/v1/vendor/me/returns/${returnId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return result.ok && count(result.data.id) > 0 ? mapVendorReturn(result.data) : null;
}

export async function getVendorReturnEvents(returnId: string): Promise<VendorReturnEvent[]> {
  const token = await getSellerAccessToken();
  if (!token) return [];

  const result = await wpRest<{ items?: Array<Record<string, unknown>> }>(
    `/papelito/v1/returns/${returnId}/events`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!result.ok || !Array.isArray(result.data.items)) return [];

  return result.data.items.map((raw) => ({
    event: text(raw.event),
    fromStatus: typeof raw.from_status === "string" ? raw.from_status : null,
    toStatus: typeof raw.to_status === "string" ? raw.to_status : null,
    actorUserId: count(raw.actor_user_id),
    createdAt: text(raw.created_at),
  }));
}
