import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import { VENDOR_STOCK_PER_PAGE_OPTIONS } from "@/features/vendor-stock/types/vendor-stock";
import type { VendorStockFilters } from "@/features/vendor-stock/types/vendor-stock";

import { buildStockHref } from "./stock-href";

const stepClassName = [
  "inline-flex h-9 min-w-9 items-center justify-center border-2 border-[#1a1a1a] bg-white px-2 text-[11px] font-black tabular-nums text-[#1a1a1a] transition hover:bg-brand-yellow",
  FOCUS_RING,
].join(" ");

const disabledClassName =
  "inline-flex h-9 min-w-9 cursor-not-allowed items-center justify-center border-2 border-[#1a1a1a]/18 px-2 text-[#1a1a1a]/30";

/**
 * Janela de páginas: primeira, última, a atual e uma vizinha de cada lado.
 *
 * Um catálogo de centenas de SKUs passa de 25 páginas, e listar todas viraria uma faixa de
 * números ilegível. O `null` é a lacuna, renderizada como reticências.
 */
function pageWindow(current: number, total: number): Array<number | null> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current]);

  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);

  const ordered = [...pages].sort((a, b) => a - b);
  const withGaps: Array<number | null> = [];

  ordered.forEach((page, index) => {
    if (index > 0 && page - ordered[index - 1] > 1) {
      withGaps.push(null);
    }

    withGaps.push(page);
  });

  return withGaps;
}

/**
 * Quantos itens por página.
 *
 * Links, e não um select: são três opções, cabem à vista, funcionam sem JavaScript e entram no
 * mesmo idioma do resto da paginação. Trocar o tamanho **volta para a página 1** — `buildStockHref`
 * já é assim por padrão —, porque a página 7 de 20 em 20 não existe quando a lista passa a ter 100
 * por página, e cair numa página vazia parece uma lista vazia.
 */
function PerPageChoice({ filters }: { filters: VendorStockFilters }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/62"
        id="stock-per-page-label"
      >
        Por página
      </span>
      <ul aria-labelledby="stock-per-page-label" className="flex items-center gap-1">
        {VENDOR_STOCK_PER_PAGE_OPTIONS.map((option) => {
          const active = filters.perPage === option;

          return (
            <li key={option}>
              {active ? (
                <span
                  aria-current="true"
                  className="inline-flex h-9 min-w-9 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-2 text-[11px] font-black tabular-nums text-brand-yellow"
                >
                  {option}
                </span>
              ) : (
                <Link
                  aria-label={`Mostrar ${option} itens por página`}
                  className={stepClassName}
                  href={buildStockHref({ ...filters, perPage: option })}
                  scroll={false}
                >
                  {option}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function StockPagination({
  filters,
  page,
  perPage,
  total,
  totalPages,
}: {
  filters: VendorStockFilters;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}) {
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(total, page * perPage);

  return (
    <nav
      aria-label="Paginação do estoque"
      className="flex flex-col gap-3 border-t-2 border-[#1a1a1a] bg-brand-yellow/12 px-5 py-4 md:flex-row md:flex-wrap md:items-center md:justify-between"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/62">
        {total === 0 ? (
          "Nenhum item neste recorte"
        ) : (
          <>
            <span className="tabular-nums">
              {first}–{last}
            </span>{" "}
            de <span className="tabular-nums">{total}</span>{" "}
            {total === 1 ? "item" : "itens"}
          </>
        )}
      </p>

      <PerPageChoice filters={filters} />

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {page > 1 ? (
            <Link
              aria-label="Página anterior"
              className={stepClassName}
              href={buildStockHref(filters, page - 1)}
              scroll={false}
            >
              <ChevronLeft aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            </Link>
          ) : (
            <span aria-disabled="true" className={disabledClassName}>
              <ChevronLeft aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            </span>
          )}

          {pageWindow(page, totalPages).map((candidate, index) =>
            candidate === null ? (
              <span
                aria-hidden
                className="px-1 text-[11px] font-black text-[#1a1a1a]/40"
                key={`gap-${index}`}
              >
                …
              </span>
            ) : candidate === page ? (
              <span
                aria-current="page"
                className="inline-flex h-9 min-w-9 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-2 text-[11px] font-black tabular-nums text-brand-yellow"
                key={candidate}
              >
                {candidate}
              </span>
            ) : (
              <Link
                aria-label={`Página ${candidate}`}
                className={stepClassName}
                href={buildStockHref(filters, candidate)}
                key={candidate}
                scroll={false}
              >
                {candidate}
              </Link>
            ),
          )}

          {page < totalPages ? (
            <Link
              aria-label="Próxima página"
              className={stepClassName}
              href={buildStockHref(filters, page + 1)}
              scroll={false}
            >
              <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            </Link>
          ) : (
            <span aria-disabled="true" className={disabledClassName}>
              <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
