"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";

import type { VendorOrderSummary } from "@/features/vendor-orders/types/vendor-orders";
import { formatBRLIntl } from "@/lib/format-currency";

import { VendorOrderStatusBadge } from "./vendor-order-status-badge";

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR").format(date);
}

function hasTextSelection() {
  if (typeof window === "undefined") return false;
  const selection = window.getSelection();
  return Boolean(selection && selection.toString().length > 0);
}

export function VendorOrdersTableRow({ order }: { order: VendorOrderSummary }) {
  const router = useRouter();
  const href = `/vendor/pedidos/${order.id}`;

  function navigate() {
    router.push(href);
  }

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    if (event.defaultPrevented || hasTextSelection()) return;
    navigate();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate();
    }
  }

  return (
    <tr
      aria-label={`Abrir pedido #${order.orderNumber}`}
      className="cursor-pointer transition-colors hover:bg-brand-dark/4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-dark"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
    >
      <td className="border-b border-brand-dark/8 px-4 py-3.5 text-sm font-semibold">#{order.orderNumber}</td>
      <td className="border-b border-brand-dark/8 px-4 py-3.5 text-sm text-brand-dark/66">{formatDate(order.createdAt)}</td>
      <td className="border-b border-brand-dark/8 px-4 py-3.5 text-sm text-brand-dark/72">{order.customerName}</td>
      <td className="max-w-52 truncate border-b border-brand-dark/8 px-4 py-3.5 text-sm text-brand-dark/66">{order.itemsLabel}</td>
      <td className="border-b border-brand-dark/8 px-4 py-3.5"><VendorOrderStatusBadge status={order.status} /></td>
      <td className="border-b border-brand-dark/8 px-4 py-3.5 text-right text-sm font-semibold">{formatBRLIntl(order.total)}</td>
    </tr>
  );
}
