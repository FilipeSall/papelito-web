import Link from "next/link";

import { Panel } from "@/components/layout/operational-panel";
import type { VendorOrderStatus, VendorOrdersSnapshot } from "@/features/vendor-orders/types/vendor-orders";
import { formatBRLIntl } from "@/lib/format-currency";

import { VendorOrderStatusBadge } from "./vendor-order-status-badge";

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR").format(date);
}

function href(filters: { page?: number; search: string; status: VendorOrderStatus | "all" }) {
  const params = new URLSearchParams({ status: filters.status });
  if (filters.search) params.set("search", filters.search);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return `/vendor/pedidos?${params.toString()}`;
}

export function VendorOrdersTable({
  search,
  snapshot,
  status,
}: {
  search: string;
  snapshot: VendorOrdersSnapshot;
  status: VendorOrderStatus | "all";
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-brand-dark/10 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <form className="flex gap-2" method="get">
          <input name="status" type="hidden" value={status} />
          <input
            className="h-11 rounded-[12px] border border-brand-dark/16 bg-white px-4 text-sm outline-none focus:border-brand-dark"
            defaultValue={search}
            name="search"
            placeholder="Pedido ou cliente"
          />
          <button className="rounded-[12px] bg-brand-dark px-5 text-sm font-semibold text-brand-yellow">
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {([
            ["all", "Todos"],
            ["aguardando_pagamento", "Aguardando pagamento"],
            ["aguardando_envio", "Aguardando envio"],
            ["em_separacao", "Separacao"],
            ["enviado", "Enviados"],
            ["entregue", "Entregues"],
            ["cancelado", "Cancelados"],
          ] as Array<[VendorOrderStatus | "all", string]>).map(([key, label]) => (
            <Link
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
                status === key
                  ? "border-brand-dark bg-brand-dark text-brand-yellow"
                  : "border-brand-dark/15 bg-white"
              }`}
              href={href({ search, status: key })}
              key={key}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      {snapshot.items.length === 0 ? (
        <p className="px-5 py-10 text-sm text-brand-dark/65">Nenhum pedido encontrado.</p>
      ) : (
        <div className="overflow-x-auto px-2 pt-2">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                {["Pedido", "Data", "Cliente", "Itens", "Status", "Total", ""].map((label, index) => (
                  <th
                    className="border-b border-brand-dark/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48"
                    key={`${label}-${index}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshot.items.map((order) => (
                <tr key={order.id}>
                  <td className="border-b border-brand-dark/8 px-4 py-3 text-sm font-semibold">#{order.orderNumber}</td>
                  <td className="border-b border-brand-dark/8 px-4 py-3 text-sm text-brand-dark/66">{formatDate(order.createdAt)}</td>
                  <td className="border-b border-brand-dark/8 px-4 py-3 text-sm text-brand-dark/72">{order.customerName}</td>
                  <td className="max-w-52 truncate border-b border-brand-dark/8 px-4 py-3 text-sm text-brand-dark/66">{order.itemsLabel}</td>
                  <td className="border-b border-brand-dark/8 px-4 py-3"><VendorOrderStatusBadge status={order.status} /></td>
                  <td className="border-b border-brand-dark/8 px-4 py-3 text-sm font-semibold">{formatBRLIntl(order.total)}</td>
                  <td className="border-b border-brand-dark/8 px-4 py-3">
                    <Link className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-dark underline" href={`/vendor/pedidos/${order.id}`}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between px-5 py-4 text-sm text-brand-dark/62">
        <span>{snapshot.total} pedidos</span>
        <div className="flex items-center gap-2">
          {snapshot.page > 1 ? (
            <Link
              className="rounded-[10px] border border-brand-dark/16 px-3 py-2"
              href={href({ page: snapshot.page - 1, search, status })}
            >
              Anterior
            </Link>
          ) : null}
          <span>Pagina {snapshot.page} de {snapshot.totalPages}</span>
          {snapshot.page < snapshot.totalPages ? (
            <Link
              className="rounded-[10px] border border-brand-dark/16 px-3 py-2"
              href={href({ page: snapshot.page + 1, search, status })}
            >
              Proxima
            </Link>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
