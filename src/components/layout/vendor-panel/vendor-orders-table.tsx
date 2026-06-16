"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { FormEvent, startTransition, useMemo, useOptimistic } from "react";
import useSWR from "swr";

import { Panel } from "@/components/layout/operational-panel";
import { fetchVendorOrders } from "@/features/vendor-orders/services/vendor-orders-client";
import type {
  VendorOrderStatus,
  VendorOrdersFilters,
  VendorOrdersSnapshot,
} from "@/features/vendor-orders/types/vendor-orders";
import {
  areVendorOrdersFiltersEqual,
  buildVendorOrdersCacheKey,
  buildVendorOrdersHref,
  normalizeVendorOrdersStatus,
  parseVendorOrdersPage,
  parseVendorOrdersSearch,
} from "@/features/vendor-orders/utils/vendor-order-filters";

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

function emptySnapshot(page: number): VendorOrdersSnapshot {
  return { items: [], page, perPage: 20, total: 0, totalPages: 1 };
}

function LoadingState() {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-semibold text-brand-dark">Carregando pedidos...</p>
      <p className="mt-1 text-sm text-brand-dark/60">Atualizando os pedidos para este filtro.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-semibold text-brand-dark">Nao foi possivel carregar os pedidos.</p>
      <p className="mt-1 text-sm text-brand-dark/60">{message}</p>
      <button
        className="mt-4 cursor-pointer rounded-[12px] bg-brand-dark px-5 py-2.5 text-sm font-semibold text-brand-yellow transition hover:opacity-90"
        onClick={onRetry}
        type="button"
      >
        Tentar novamente
      </button>
    </div>
  );
}

export function VendorOrdersTable({
  initialFilters,
  initialSnapshot,
}: {
  initialFilters: VendorOrdersFilters;
  initialSnapshot: VendorOrdersSnapshot;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const urlFilters = useMemo(() => {
    const currentSearchParams = new URLSearchParams(searchParamsString);
    return {
      page: parseVendorOrdersPage(currentSearchParams.get("page")),
      search: parseVendorOrdersSearch(currentSearchParams.get("search")),
      status: normalizeVendorOrdersStatus(currentSearchParams.get("status")),
    };
  }, [searchParamsString]);
  const [filters, setOptimisticFilters] = useOptimistic(
    urlFilters,
    (_current, nextFilters: VendorOrdersFilters) => nextFilters,
  );

  const initialKey = useMemo(() => buildVendorOrdersCacheKey(initialFilters), [initialFilters]);
  const currentKey = useMemo(() => buildVendorOrdersCacheKey(filters), [filters]);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    currentKey,
    () => fetchVendorOrders(filters),
    {
      fallbackData: currentKey === initialKey ? initialSnapshot : undefined,
      refreshInterval: 30_000,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      revalidateOnMount: currentKey === initialKey ? false : undefined,
    },
  );

  const snapshot = data ?? emptySnapshot(filters.page);
  const isEmpty = snapshot.items.length === 0;
  const showLoading = !data && (isLoading || isValidating);
  const showError = !data && error instanceof Error;

  function commitFilters(nextFilters: VendorOrdersFilters) {
    if (areVendorOrdersFiltersEqual(filters, nextFilters)) return;

    window.history.pushState(null, "", buildVendorOrdersHref(nextFilters, pathname));
    startTransition(() => {
      setOptimisticFilters(nextFilters);
    });
  }

  function handleStatusChange(nextStatus: VendorOrderStatus | "all") {
    commitFilters({
      page: 1,
      search: filters.search,
      status: nextStatus,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = parseVendorOrdersSearch(String(formData.get("search") ?? ""));

    commitFilters({
      page: 1,
      search,
      status: filters.status,
    });
  }

  function handlePageChange(page: number) {
    commitFilters({
      page,
      search: filters.search,
      status: filters.status,
    });
  }

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-brand-dark/10 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <form className="flex gap-2" method="get" onSubmit={handleSubmit}>
          <input
            className="h-11 w-full rounded-[12px] border border-brand-dark/16 bg-white px-4 text-sm outline-none transition focus:border-brand-dark xl:w-64"
            defaultValue={filters.search}
            key={`${filters.status}:${filters.page}:${filters.search}`}
            name="search"
            placeholder="Pedido ou cliente"
          />
          <button className="cursor-pointer rounded-[12px] bg-brand-dark px-5 text-sm font-semibold text-brand-yellow transition hover:opacity-90">
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map(([key, label]) => (
            <button
              aria-pressed={filters.status === key}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                filters.status === key
                  ? "border-brand-dark bg-brand-dark text-brand-yellow"
                  : "border-brand-dark/15 bg-white text-brand-dark/70 hover:border-brand-dark/40 hover:text-brand-dark"
              }`}
              key={key}
              onClick={() => handleStatusChange(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {showLoading ? (
        <LoadingState />
      ) : showError ? (
        <ErrorState message={error.message} onRetry={() => void mutate()} />
      ) : isEmpty ? (
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
            <button
              className="rounded-[10px] border border-brand-dark/16 px-3 py-2 transition hover:border-brand-dark/40"
              onClick={() => handlePageChange(snapshot.page - 1)}
              type="button"
            >
              Anterior
            </button>
          ) : null}
          <span>Pagina {snapshot.page} de {snapshot.totalPages}</span>
          {snapshot.page < snapshot.totalPages ? (
            <button
              className="rounded-[10px] border border-brand-dark/16 px-3 py-2 transition hover:border-brand-dark/40"
              onClick={() => handlePageChange(snapshot.page + 1)}
              type="button"
            >
              Proxima
            </button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
