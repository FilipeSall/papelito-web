"use client";

import Link from "next/link";

import type { VendorOrderSummary } from "@/features/vendor-orders/types/vendor-orders";
import { formatBRLIntl } from "@/lib/format-currency";

import { VendorOrderStatusBadge } from "./vendor-order-status-badge";

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR").format(date);
}

export function VendorOrdersCard({ order }: { order: VendorOrderSummary }) {
  return (
    <Link
      aria-label={`Abrir pedido #${order.orderNumber}`}
      className="block rounded-xl border border-brand-dark/12 bg-white p-4 transition-colors hover:border-brand-dark/30 hover:bg-brand-dark/2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
      href={`/vendor/pedidos/${order.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">#{order.orderNumber}</p>
          <p className="mt-0.5 text-xs text-brand-dark/55">{formatDate(order.createdAt)}</p>
        </div>
        <VendorOrderStatusBadge status={order.status} />
      </div>
      <p className="mt-3 text-sm text-brand-dark/72">{order.customerName}</p>
      <p className="mt-1 truncate text-xs text-brand-dark/55">{order.itemsLabel}</p>
      <p className="mt-3 text-sm font-semibold">{formatBRLIntl(order.total)}</p>
    </Link>
  );
}
