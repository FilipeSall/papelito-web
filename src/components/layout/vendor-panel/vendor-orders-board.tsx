"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Search, TriangleAlert, X } from "lucide-react";
import {
  Suspense,
  startTransition,
  useMemo,
  useOptimistic,
  useState,
  type ReactNode,
  type SubmitEvent,
} from "react";
import useSWR from "swr";

import { EmptyResult, FOCUS_RING, InlineAlert } from "@/components/layout/operational-panel";
import { fetchVendorOrders } from "@/features/vendor-orders/services/vendor-orders-client";
import {
  VENDOR_ORDERS_PER_PAGE,
  type VendorOrdersFilters,
  type VendorOrdersSnapshot,
} from "@/features/vendor-orders/types/vendor-orders";
import {
  areVendorOrdersFiltersEqual,
  buildVendorOrdersCacheKey,
  buildVendorOrdersHref,
  normalizeVendorOrdersFiscal,
  normalizeVendorOrdersStatus,
  parseVendorOrdersPage,
  parseVendorOrdersSearch,
} from "@/features/vendor-orders/utils/vendor-order-filters";

import { vendorOrderStatusShape } from "./order-status";
import { VendorOrdersPagination } from "./vendor-orders-pagination";
import { VendorOrdersRow } from "./vendor-orders-row";
import { VendorOrdersSummaryPanel } from "./vendor-orders-summary";

const emptySummary: VendorOrdersSnapshot["summary"] = {
  all: 0,
  aguardando_pagamento: 0,
  aguardando_estoque: 0,
  aguardando_envio: 0,
  em_separacao: 0,
  enviado: 0,
  entregue: 0,
  cancelado: 0,
  fiscal_pending: 0,
};

function emptySnapshot(page: number): VendorOrdersSnapshot {
  return { items: [], page, perPage: VENDOR_ORDERS_PER_PAGE, summary: emptySummary, total: 0, totalPages: 1 };
}

/**
 * Esqueleto com a altura das linhas reais, para a moldura não colapsar e a
 * página não pular quando o recorte troca.
 */
function LoadingRows() {
  return (
    <li aria-hidden className="bg-[#faf8f2] px-5 py-4">
      <div className="space-y-4">
        {[0, 1, 2, 3].map((row) => (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6" key={row}>
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-24 animate-pulse bg-[#1a1a1a]/12" />
              <div className="h-3.5 w-44 animate-pulse bg-[#1a1a1a]/8" />
            </div>
            <div className="h-3.5 w-40 animate-pulse bg-[#1a1a1a]/8 lg:w-[26%]" />
            <div className="h-7 w-48 animate-pulse bg-[#1a1a1a]/10" />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando pedidos…</span>
    </li>
  );
}

/**
 * Campo de busca com rascunho próprio.
 *
 * O estado inicial vem da URL e o componente é remontado por `key` quando ela
 * muda — assim o rascunho acompanha "limpar busca" e o botão Voltar sem um
 * efeito que sincronize estado com props.
 */
function SearchField({
  onClear,
  initialValue,
}: {
  initialValue: string;
  onClear: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a1a1a]/45"
        strokeWidth={2.2}
      />
      <input
        className={[
          "h-11 w-full min-w-0 border-2 border-[#1a1a1a] bg-white pl-9 pr-9 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40 sm:max-w-md",
          FOCUS_RING,
        ].join(" ")}
        id="vendor-orders-search"
        name="search"
        onChange={(event) => setValue(event.target.value)}
        placeholder="Número do pedido ou comprador"
        type="search"
        value={value}
      />
      {value ? (
        <button
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center text-[#1a1a1a]/55 transition hover:text-[#1a1a1a]"
          onClick={() => {
            setValue("");
            onClear();
          }}
          type="button"
        >
          <X aria-hidden className="h-4 w-4" strokeWidth={2.4} />
        </button>
      ) : null}
    </div>
  );
}

/**
 * A idade da linha é tempo decorrido, não data de calendário: o mesmo cálculo
 * no servidor e no cliente cai no mesmo balde de dias. A indireção existe pelo
 * mesmo motivo que em `VendorOrderDeliveryCountdown` — o relógio não é puro, e
 * lê-lo direto no corpo do componente é sinalizado pelo compilador.
 */
function currentTimestamp() {
  return Date.now();
}

function summaryLabel(filters: VendorOrdersFilters, total: number): string {
  const scope =
    filters.fiscal === "pending"
      ? "pagos sem nota fiscal"
      : filters.status === "all"
        ? "no total"
        : `em ${vendorOrderStatusShape(filters.status).label.toLowerCase()}`;

  return `${total} ${total === 1 ? "pedido" : "pedidos"} ${scope}`;
}

interface VendorOrdersBoardProps {
  initialFilters: VendorOrdersFilters;
  initialSnapshot: VendorOrdersSnapshot;
}

function VendorOrdersBoardContent({
  initialFilters,
  initialSnapshot,
}: Readonly<VendorOrdersBoardProps>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const urlFilters = useMemo(() => {
    const current = new URLSearchParams(searchParamsString);
    return {
      fiscal: normalizeVendorOrdersFiscal(current.get("fiscal")),
      page: parseVendorOrdersPage(current.get("page")),
      search: parseVendorOrdersSearch(current.get("search")),
      status: normalizeVendorOrdersStatus(current.get("status")),
    };
  }, [searchParamsString]);
  const [filters, setOptimisticFilters] = useOptimistic(
    urlFilters,
    (_current, nextFilters: VendorOrdersFilters) => nextFilters,
  );
  const now = currentTimestamp();

  const initialKey = useMemo(() => buildVendorOrdersCacheKey(initialFilters), [initialFilters]);
  const currentKey = useMemo(() => buildVendorOrdersCacheKey(filters), [filters]);
  // Snapshot inicial ilegível não vira `fallbackData`: servi-lo mostraria "fila
  // vazia" para uma falha de leitura, e a revalidação do SWR é justamente a
  // chance de a página se recuperar sozinha.
  const usableInitial = currentKey === initialKey && !initialSnapshot.unavailable;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    currentKey,
    () => fetchVendorOrders(filters),
    {
      fallbackData: usableInitial ? initialSnapshot : undefined,
      refreshInterval: 30_000,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      revalidateOnMount: usableInitial ? false : undefined,
    },
  );

  const snapshot = data ?? emptySnapshot(filters.page);
  const showLoading = !data && (isLoading || isValidating);
  const showError = !data && error instanceof Error;

  function commitFilters(nextFilters: VendorOrdersFilters) {
    if (areVendorOrdersFiltersEqual(filters, nextFilters)) return;

    window.history.pushState(null, "", buildVendorOrdersHref(nextFilters, pathname));
    startTransition(() => {
      setOptimisticFilters(nextFilters);
    });
  }

  function handleScopeChange(next: Pick<VendorOrdersFilters, "fiscal" | "status">) {
    commitFilters({ ...next, page: 1, search: filters.search });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = formData.get("search");

    commitFilters({
      fiscal: filters.fiscal,
      page: 1,
      search: parseVendorOrdersSearch(typeof value === "string" ? value : ""),
      status: filters.status,
    });
  }

  function handlePageChange(page: number) {
    commitFilters({ ...filters, page });
  }

  let rows: ReactNode;
  if (showLoading) {
    rows = <LoadingRows />;
  } else if (showError) {
    rows = (
      <li className="bg-[#faf8f2] px-5 py-10">
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <InlineAlert icon={TriangleAlert} tone="critical">
            ⚠ {error.message}
          </InlineAlert>
          <button
            className={[
              "inline-flex h-11 cursor-pointer items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none",
              FOCUS_RING,
            ].join(" ")}
            onClick={() => void mutate()}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      </li>
    );
  } else if (snapshot.items.length === 0) {
    rows = (
      <li className="bg-[#faf8f2] p-5">
        <EmptyResult
          body={
            filters.search
              ? `Nenhum pedido responde por “${filters.search}” nesta fila. Limpe a busca ou escolha outra fila acima.`
              : "Quando um pedido cair nesta fila ele aparece aqui. Escolha outra fila acima para ver o resto da carteira."
          }
          title={filters.search ? "Nenhum pedido encontrado" : "Fila vazia"}
        />
      </li>
    );
  } else {
    rows = snapshot.items.map((order) => (
      <VendorOrdersRow key={order.id} now={now} order={order} />
    ));
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorOrdersSummaryPanel
        filters={filters}
        onSelect={handleScopeChange}
        summary={snapshot.summary}
      />

      <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 w-full bg-brand-yellow" />

        <form
          className="flex flex-col gap-3 border-b-2 border-[#1a1a1a] bg-brand-yellow/18 px-5 py-4 sm:flex-row sm:items-end"
          method="get"
          onSubmit={handleSubmit}
        >
          <input name="status" type="hidden" value={filters.status} />
          {filters.fiscal !== "all" ? <input name="fiscal" type="hidden" value={filters.fiscal} /> : null}

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label
              className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
              htmlFor="vendor-orders-search"
            >
              <span className="flex h-4 items-center">Busca</span>
            </label>
            <SearchField
              initialValue={filters.search}
              key={filters.search}
              onClear={() => commitFilters({ ...filters, page: 1, search: "" })}
            />
          </div>

          <button
            className={[
              "inline-flex h-11 flex-none cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none",
              FOCUS_RING,
            ].join(" ")}
            type="submit"
          >
            Buscar
          </button>
        </form>

        <p
          aria-live="polite"
          className="border-b-2 border-[#1a1a1a] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55"
        >
          {summaryLabel(filters, snapshot.total)}
        </p>

        <ul className="divide-y-2 divide-[#1a1a1a]/10">{rows}</ul>

        <div className="border-t-2 border-[#1a1a1a]">
          <VendorOrdersPagination
            onPageChange={handlePageChange}
            page={snapshot.page}
            perPage={snapshot.perPage}
            total={snapshot.total}
            totalPages={snapshot.totalPages}
          />
        </div>
      </section>
    </div>
  );
}

/**
 * O boundary é obrigatório: este componente chama `useSearchParams()` e, sem ele, o `next build`
 * falha no prerender da rota com `missing-suspense-with-csr-bailout`. Fica embutido aqui, e não na
 * página, para não depender de cada chamador lembrar — mesmo padrão do `NavigationLoader`.
 */
export function VendorOrdersBoard(props: React.ComponentProps<typeof VendorOrdersBoardContent>) {
  return (
    <Suspense fallback={null}>
      <VendorOrdersBoardContent {...props} />
    </Suspense>
  );
}
