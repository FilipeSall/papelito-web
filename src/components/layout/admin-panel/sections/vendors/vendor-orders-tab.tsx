import Link from "next/link";

import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";
import { formatBRLIntl } from "@/lib/format-currency";
import type { AdminVendorOrdersSnapshot } from "@/lib/server/admin-vendor-operations";

import { Panel } from "../../primitives";

import { type VendorDetailContext, vendorDetailHref } from "./vendor-detail-context";
import { formatVendorDateTime } from "./vendor-detail-format";

const ORDER_STATUSES: Array<[VendorOrderStatus | "all", string]> = [
  ["all", "Todos"],
  ["aguardando_pagamento", "Aguardando pagamento"],
  ["aguardando_envio", "Aguardando envio"],
  ["em_separacao", "Separação"],
  ["enviado", "Enviados"],
  ["entregue", "Entregues"],
  ["cancelado", "Cancelados"],
];

function OrderStatusBadge({ status }: { status: VendorOrderStatus }) {
  const label =
    status === "aguardando_pagamento"
      ? "Aguardando pagamento"
      : status === "aguardando_envio"
        ? "Aguardando envio"
        : status === "em_separacao"
          ? "Em separação"
          : status === "enviado"
            ? "Enviado"
            : status === "entregue"
              ? "Entregue"
              : "Cancelado";
  const tone =
    status === "entregue"
      ? "bg-[#e4efe0] text-[#28422d]"
      : status === "cancelado"
        ? "bg-[#f3e3df] text-[#7a3428]"
        : status === "aguardando_pagamento"
          ? "bg-[#e7e7ea] text-[#4a4a52]"
          : "bg-[#f4edd3] text-[#5d4d1b]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone}`}>
      {label}
    </span>
  );
}

export function VendorOrdersTab({
  ctx,
  snapshot,
}: {
  ctx: VendorDetailContext;
  snapshot: AdminVendorOrdersSnapshot | null;
}) {
  const { orderFilters, origin } = ctx;

  return (
    <Panel className="space-y-4 p-5 md:p-6">
      <div className="flex flex-col gap-4 border-b border-[#231f20]/10 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <form className="flex gap-2" method="get">
          {origin.page > 1 ? (
            <input name="originPage" type="hidden" value={String(origin.page)} />
          ) : null}
          {origin.search ? <input name="originSearch" type="hidden" value={origin.search} /> : null}
          {origin.status && origin.status !== "pending" ? (
            <input name="originStatus" type="hidden" value={origin.status} />
          ) : null}
          <input name="tab" type="hidden" value="orders" />
          {orderFilters.status !== "all" ? (
            <input name="orderStatus" type="hidden" value={orderFilters.status} />
          ) : null}
          <input
            className="h-11 rounded-[12px] border border-[#231f20]/16 bg-white px-4 text-sm outline-none focus:border-[#231f20]"
            defaultValue={orderFilters.search}
            name="orderSearch"
            placeholder="Pedido ou cliente"
          />
          <button className="rounded-[12px] bg-[#231f20] px-5 text-sm font-semibold text-brand-yellow">
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map(([statusValue, label]) => (
            <Link
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
                orderFilters.status === statusValue
                  ? "border-[#231f20] bg-[#231f20] text-brand-yellow"
                  : "border-[#231f20]/15 bg-white"
              }`}
              href={vendorDetailHref(ctx, {
                tab: "orders",
                orderFilters: { page: 1, status: statusValue },
              })}
              key={statusValue}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {snapshot && snapshot.items.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {["Pedido", "Data", "Cliente", "Itens", "Status", "Total"].map((label) => (
                    <th
                      className="border-b border-[#231f20]/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48"
                      key={label}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshot.items.map((order) => (
                  <tr key={order.id}>
                    <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm font-semibold text-[#231f20]">
                      #{order.orderNumber}
                    </td>
                    <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/72">
                      {formatVendorDateTime(order.createdAt)}
                    </td>
                    <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/72">
                      {order.customerName}
                    </td>
                    <td className="max-w-64 truncate border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/72">
                      {order.itemsLabel}
                    </td>
                    <td className="border-b border-[#231f20]/8 px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm font-semibold text-[#231f20]">
                      {formatBRLIntl(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-[#231f20]/62">
            <span>{snapshot.total} pedidos</span>
            <div className="flex items-center gap-2">
              {snapshot.page > 1 ? (
                <Link
                  className="rounded-[10px] border border-[#231f20]/16 px-3 py-2"
                  href={vendorDetailHref(ctx, {
                    tab: "orders",
                    orderFilters: { page: snapshot.page - 1 },
                  })}
                >
                  Anterior
                </Link>
              ) : null}
              <span>
                Página {snapshot.page} de {snapshot.totalPages}
              </span>
              {snapshot.page < snapshot.totalPages ? (
                <Link
                  className="rounded-[10px] border border-[#231f20]/16 px-3 py-2"
                  href={vendorDetailHref(ctx, {
                    tab: "orders",
                    orderFilters: { page: snapshot.page + 1 },
                  })}
                >
                  Próxima
                </Link>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-[#231f20]/62">Nenhum pedido encontrado para este filtro.</p>
      )}
    </Panel>
  );
}
