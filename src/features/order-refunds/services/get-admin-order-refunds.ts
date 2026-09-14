import "server-only";

import { readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

import type {
  AdminOrderRefund,
  AdminOrderRefundsFilter,
  AdminOrderRefundsSnapshot,
} from "../types/admin-order-refund";

type WpAdminOrderRefund = {
  amountCents?: number;
  attempts?: number;
  customerId?: number;
  id?: number;
  lastError?: string;
  mode?: string;
  orderId?: number;
  overdue?: boolean;
  reason?: string;
  receiptNumber?: string;
  refundDueAt?: string;
  requestedAt?: string;
  settledAt?: string;
  source?: string;
  status?: string;
  vendorId?: number;
};

const STATUSES = new Set<AdminOrderRefund["status"]>(["processando", "reembolsado", "falhou", "manual_pendente"]);

export function mapAdminOrderRefund(item: WpAdminOrderRefund): AdminOrderRefund | null {
  const status = item.status ?? "";

  if (!Number(item.id) || !STATUSES.has(status as AdminOrderRefund["status"])) return null;

  return {
    amountCents: Number(item.amountCents) || 0,
    attempts: Number(item.attempts) || 0,
    customerId: Number(item.customerId) || 0,
    id: Number(item.id),
    lastError: item.lastError ?? "",
    mode: item.mode === "api" ? "api" : "manual",
    orderId: Number(item.orderId) || 0,
    overdue: item.overdue === true,
    reason: item.reason ?? "",
    receiptNumber: item.receiptNumber ?? "",
    refundDueAt: item.refundDueAt ?? "",
    requestedAt: item.requestedAt ?? "",
    settledAt: item.settledAt ?? "",
    source: item.source ?? "",
    status: status as AdminOrderRefund["status"],
    vendorId: Number(item.vendorId) || 0,
  };
}

export async function getAdminOrderRefunds(filter: AdminOrderRefundsFilter): Promise<AdminOrderRefundsSnapshot> {
  const result = await readWithAdminApiSession((accessToken) =>
    wpRest<{ items?: WpAdminOrderRefund[] }>(`/papelito/v1/admin/order-refunds?filter=${filter}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  if ("error" in result || !result.data.ok) {
    return { filter, items: [], unavailable: true };
  }

  return {
    filter,
    items: (result.data.data.items ?? [])
      .map(mapAdminOrderRefund)
      .filter((item): item is AdminOrderRefund => item !== null),
    unavailable: false,
  };
}
