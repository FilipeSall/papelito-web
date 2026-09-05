"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";

const stepClassName = [
  "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white px-2 text-[11px] font-black tabular-nums text-[#1a1a1a] transition hover:bg-brand-yellow",
  FOCUS_RING,
].join(" ");

const disabledClassName =
  "inline-flex h-9 min-w-9 cursor-not-allowed items-center justify-center border-2 border-[#1a1a1a]/18 px-2 text-[#1a1a1a]/30";

/**
 * Janela de páginas: primeira, última, a atual e uma vizinha de cada lado. O
 * `null` é a lacuna, renderizada como reticências.
 *
 * Mesma construção da paginação de estoque; aqui os degraus são botões, e não
 * links, porque a lista troca de página por `pushState` e revalidação em vez de
 * navegação de rota.
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

export function VendorOrdersPagination({
  onPageChange,
  page,
  perPage,
  total,
  totalPages,
}: {
  onPageChange: (page: number) => void;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}) {
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(total, page * perPage);

  return (
    <nav
      aria-label="Paginação dos pedidos"
      className="flex flex-col gap-3 bg-brand-yellow/12 px-5 py-4 md:flex-row md:flex-wrap md:items-center md:justify-between"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/62">
        {total === 0 ? (
          "Nenhum pedido neste recorte"
        ) : (
          <>
            <span className="tabular-nums">
              {first}–{last}
            </span>{" "}
            de <span className="tabular-nums">{total}</span> {total === 1 ? "pedido" : "pedidos"}
          </>
        )}
      </p>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {page > 1 ? (
            <button
              aria-label="Página anterior"
              className={stepClassName}
              onClick={() => onPageChange(page - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            </button>
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
              <button
                aria-label={`Página ${candidate}`}
                className={stepClassName}
                key={candidate}
                onClick={() => onPageChange(candidate)}
                type="button"
              >
                {candidate}
              </button>
            ),
          )}

          {page < totalPages ? (
            <button
              aria-label="Próxima página"
              className={stepClassName}
              onClick={() => onPageChange(page + 1)}
              type="button"
            >
              <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            </button>
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
