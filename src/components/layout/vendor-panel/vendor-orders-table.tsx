import Link from "next/link";

import { Panel } from "@/components/layout/operational-panel";
import type { VendorOrderStatus, VendorOrdersSnapshot } from "@/features/vendor-orders/types/vendor-orders";

import { VendorOrdersCard } from "./vendor-orders-card";
import { VendorOrdersTableRow } from "./vendor-orders-table-row";

const statusFilters: Array<[VendorOrderStatus | "all", string]> = [
  ["all", "Todos"],
  ["aguardando_pagamento", "Aguardando pagamento"],
  ["aguardando_envio", "Aguardando envio"],
  ["em_separacao", "Separacao"],
  ["enviado", "Enviados"],
  ["entregue", "Entregues"],
  ["cancelado", "Cancelados"],
];

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
  const isEmpty = snapshot.items.length === 0;

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-brand-dark/10 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <form className="flex gap-2" method="get">
          <input name="status" type="hidden" value={status} />
          <input
            className="h-11 w-full rounded-[12px] border border-brand-dark/16 bg-white px-4 text-sm outline-none transition focus:border-brand-dark xl:w-64"
            defaultValue={search}
            name="search"
            placeholder="Pedido ou cliente"
          />
          <button className="cursor-pointer rounded-[12px] bg-brand-dark px-5 text-sm font-semibold text-brand-yellow transition hover:opacity-90">
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map(([key, label]) => (
            <Link
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                status === key
                  ? "border-brand-dark bg-brand-dark text-brand-yellow"
                  : "border-brand-dark/15 bg-white text-brand-dark/70 hover:border-brand-dark/40 hover:text-brand-dark"
              }`}
              href={href({ search, status: key })}
              key={key}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-semibold text-brand-dark">Nenhum pedido encontrado.</p>
          <p className="mt-1 text-sm text-brand-dark/60">
            Ajuste a busca ou o filtro de status para ver outros pedidos.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto px-2 pt-2 md:block">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {["Pedido", "Data", "Cliente", "Itens", "Status", "Total"].map((label) => (
                    <th
                      className={`border-b border-brand-dark/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48 ${
                        label === "Total" ? "text-right" : ""
                      }`}
                      key={label}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshot.items.map((order) => (
                  <VendorOrdersTableRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 px-4 py-4 md:hidden">
            {snapshot.items.map((order) => (
              <VendorOrdersCard key={order.id} order={order} />
            ))}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2 border-t border-brand-dark/10 px-5 py-4 text-sm text-brand-dark/62 sm:flex-row sm:items-center sm:justify-between">
        <span>{snapshot.total} pedidos</span>
        <div className="flex items-center gap-2">
          {snapshot.page > 1 ? (
            <Link
              className="rounded-[10px] border border-brand-dark/16 px-3 py-2 transition hover:border-brand-dark/40"
              href={href({ page: snapshot.page - 1, search, status })}
            >
              Anterior
            </Link>
          ) : null}
          <span>Pagina {snapshot.page} de {snapshot.totalPages}</span>
          {snapshot.page < snapshot.totalPages ? (
            <Link
              className="rounded-[10px] border border-brand-dark/16 px-3 py-2 transition hover:border-brand-dark/40"
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
