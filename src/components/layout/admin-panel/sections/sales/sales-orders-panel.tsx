import Link from "next/link";

import {
  buildAdminSalesFilterQuery,
  type parseAdminSalesFilters,
} from "@/lib/server/admin-sales-filters";
import type { AdminSalesOrdersSnapshot } from "@/lib/server/admin-sales-orders";

import {
  formatCompactNumber,
  formatCurrency,
  formatDateTimeLabel,
  formatOrderStatusLabel,
} from "../../formatters";
import { HardPanel, StatusBadge } from "../../primitives";

function buildPageWindow(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const window = new Set<number>([1, total, current, current - 1, current + 1]);

  if (current <= 3) {
    window.add(2).add(3).add(4);
  }

  if (current >= total - 2) {
    window.add(total - 1).add(total - 2).add(total - 3);
  }

  const sorted = Array.from(window)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: Array<number | "ellipsis"> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }

  return result;
}

export function SalesOrdersPanel({
  filters,
  snapshot,
}: {
  filters: ReturnType<typeof parseAdminSalesFilters>;
  snapshot: AdminSalesOrdersSnapshot;
}) {
  const basePath = "/admin/sales";
  const previousHref =
    snapshot.currentPage > 1
      ? `${basePath}?${buildAdminSalesFilterQuery(filters, {
          page: snapshot.currentPage - 1,
        })}`
      : null;
  const nextHref =
    snapshot.currentPage < snapshot.totalPages
      ? `${basePath}?${buildAdminSalesFilterQuery(filters, {
          page: snapshot.currentPage + 1,
        })}`
      : null;

  return (
    <HardPanel accent="black" className="overflow-hidden pb-2">
      <div className="flex flex-col gap-3 border-b border-[#231f20]/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
            Pedidos do período
          </p>
          <p className="mt-1 text-sm text-[#231f20]/66">
            {snapshot.totalOrders > 0
              ? `${formatCompactNumber(snapshot.totalOrders)} pedidos encontrados na janela selecionada.`
              : "Nenhum pedido encontrado para a janela selecionada."}
          </p>
        </div>
        <div className="inline-flex min-h-10 items-center rounded-full border border-[#231f20]/14 bg-white/82 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#231f20]/64">
          página {snapshot.currentPage} de {Math.max(snapshot.totalPages, 1)}
        </div>
      </div>

      {snapshot.orders.length === 0 ? (
        <div className="px-5 py-8 text-sm leading-6 text-[#231f20]/68">
          Sem pedidos para a janela selecionada.
        </div>
      ) : (
        <div className="overflow-x-auto px-2 pt-2">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                {["pedido", "data", "cliente", "itens", "pagamento", "status", "total"].map(
                  (header) => (
                    <th
                      key={header}
                      className="border-b border-[#231f20]/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48"
                      style={header === "itens" ? { width: 180 } : undefined}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {snapshot.orders.map((order) => (
                <tr key={order.id}>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm font-semibold text-[#231f20]/84">
                    #{order.orderNumber}
                  </td>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/74">
                    {formatDateTimeLabel(order.createdAt)}
                  </td>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/74">
                    {order.customerLabel}
                  </td>
                  <td
                    className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/74"
                    style={{ width: 180, maxWidth: 180 }}
                  >
                    <div className="group relative">
                      <div className="truncate">{order.itemsLabel}</div>
                      <div className="pointer-events-none invisible absolute left-0 top-1/2 z-30 w-max max-w-[420px] -translate-y-1/2 whitespace-nowrap rounded-md border border-[#231f20]/16 bg-[#fbf7ef] px-3 py-2 text-sm text-[#231f20]/84 opacity-0 shadow-[4px_4px_0_rgba(35,31,32,0.12)] transition group-hover:visible group-hover:opacity-100">
                        {order.itemsLabel}
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/74">
                    {order.paymentMethodLabel}
                  </td>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/74">
                    <StatusBadge className="w-full" label={formatOrderStatusLabel(order.status)} />
                  </td>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm font-semibold text-[#231f20]/84">
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[#231f20]/64">
          Lista de pedidos do período selecionado, ordenada do mais recente para o mais antigo.
        </p>
        {snapshot.totalPages > 1 ? (
          <nav aria-label="Paginas de pedidos" className="flex flex-wrap items-center gap-1.5">
            {previousHref ? (
              <Link
                aria-label="Página anterior"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] border border-[#231f20]/16 bg-white px-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#231f20]/72 hover:border-[#231f20]/32"
                href={previousHref}
              >
                ‹
              </Link>
            ) : (
              <span
                aria-disabled
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] border border-[#231f20]/8 bg-white/40 px-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#231f20]/32"
              >
                ‹
              </span>
            )}

            {buildPageWindow(snapshot.currentPage, snapshot.totalPages).map((item, index) => {
              if (item === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    aria-hidden
                    className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-[#231f20]/48"
                  >
                    …
                  </span>
                );
              }

              const isActive = item === snapshot.currentPage;

              if (isActive) {
                return (
                  <span
                    key={item}
                    aria-current="page"
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] border-2 border-[#231f20] bg-[#231f20] px-3 text-sm font-semibold text-[#ffe500]"
                  >
                    {item}
                  </span>
                );
              }

              return (
                <Link
                  key={item}
                  aria-label={`Ir para a página ${item}`}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] border border-[#231f20]/16 bg-white px-3 text-sm font-semibold text-[#231f20]/72 hover:border-[#231f20]/32"
                  href={`${basePath}?${buildAdminSalesFilterQuery(filters, { page: item })}`}
                >
                  {item}
                </Link>
              );
            })}

            {nextHref ? (
              <Link
                aria-label="Próxima página"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] border-2 border-[#231f20] bg-[#231f20] px-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#ffe500]"
                href={nextHref}
              >
                ›
              </Link>
            ) : (
              <span
                aria-disabled
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] border border-[#231f20]/8 bg-white/40 px-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#231f20]/32"
              >
                ›
              </span>
            )}
          </nav>
        ) : null}
      </div>
    </HardPanel>
  );
}
