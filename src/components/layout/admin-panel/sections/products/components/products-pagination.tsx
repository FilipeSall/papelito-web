"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { PRODUCTS_PER_PAGE_OPTIONS } from "@/constants/admin-products";

import { FOCUS_RING } from "../../../primitives";

import { buildPaginationRange } from "./pagination-range";

const CELL =
  "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center border-2 px-1.5 text-[11px] font-black uppercase tracking-[0.12em] tabular-nums transition disabled:cursor-not-allowed";
const IDLE = "border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-brand-yellow";
const CURRENT = "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]";
const OFF = "disabled:border-[#1a1a1a]/18 disabled:bg-transparent disabled:text-[#1a1a1a]/30";

function Step({
  ariaLabel,
  children,
  disabled,
  onClick,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={[CELL, IDLE, OFF, FOCUS_RING].join(" ")}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PageButton({
  isCurrent,
  isLoading,
  onChangePage,
  page,
}: {
  isCurrent: boolean;
  isLoading: boolean;
  onChangePage: (page: number) => void;
  page: number;
}) {
  return (
    <button
      aria-current={isCurrent ? "page" : undefined}
      aria-label={`Página ${page}`}
      className={[CELL, isCurrent ? CURRENT : `${IDLE} ${OFF}`, FOCUS_RING].join(" ")}
      disabled={isLoading || isCurrent}
      onClick={() => onChangePage(page)}
      type="button"
    >
      {page}
    </button>
  );
}

function PerPagePicker({
  isLoading,
  onChangePerPage,
  perPage,
}: {
  isLoading: boolean;
  onChangePerPage: (perPage: number) => void;
  perPage: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/55">
        Por página
      </span>
      <div className="flex items-center gap-1.5">
        {PRODUCTS_PER_PAGE_OPTIONS.map((option) => {
          const isCurrent = option === perPage;

          return (
            <button
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`Mostrar ${option} produtos por página`}
              className={[CELL, isCurrent ? CURRENT : `${IDLE} ${OFF}`, FOCUS_RING].join(" ")}
              disabled={isLoading || isCurrent}
              key={option}
              onClick={() => onChangePerPage(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Barra de paginação da listagem. Aparece mesmo com uma página só, porque é onde mora a troca de
 * itens por página — escondê-la deixaria o administrador preso em `100` sem caminho de volta.
 */
export function ProductsPagination({
  isLoading,
  onChangePage,
  onChangePerPage,
  page,
  perPage,
  totalPages,
  totalProducts,
}: {
  isLoading: boolean;
  onChangePage: (page: number) => void;
  onChangePerPage: (perPage: number) => void;
  page: number;
  perPage: number;
  totalPages: number;
  totalProducts: number;
}) {
  const total = Math.max(totalPages, 1);
  const current = Math.min(Math.max(page, 1), total);
  const firstOnPage = (current - 1) * perPage + 1;
  const lastOnPage = Math.min(current * perPage, totalProducts);

  return (
    <nav aria-label="Paginação" className="@container">
      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/55">
          {totalProducts > 0
            ? `${firstOnPage}–${lastOnPage} de ${totalProducts} · página ${current} de ${total}`
            : `página ${current} de ${total}`}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <PerPagePicker
            isLoading={isLoading}
            onChangePerPage={onChangePerPage}
            perPage={perPage}
          />

          {total > 1 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Step
                ariaLabel="Página anterior"
                disabled={isLoading || current <= 1}
                onClick={() => onChangePage(current - 1)}
              >
                <ChevronLeft aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              </Step>

              {buildPaginationRange(current, total).map((slot) =>
                typeof slot === "number" ? (
                  <PageButton
                    isCurrent={slot === current}
                    isLoading={isLoading}
                    key={slot}
                    onChangePage={onChangePage}
                    page={slot}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="inline-flex h-9 min-w-5 items-center justify-center text-[11px] font-black text-[#1a1a1a]/35"
                    key={slot}
                  >
                    …
                  </span>
                ),
              )}

              <Step
                ariaLabel="Próxima página"
                disabled={isLoading || current >= total}
                onClick={() => onChangePage(current + 1)}
              >
                <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              </Step>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
