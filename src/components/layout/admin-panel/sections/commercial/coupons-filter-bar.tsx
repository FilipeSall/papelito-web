"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { SelectOption } from "@/types/admin-products-manager";

import { FOCUS_RING } from "../../primitives";
import { AdminSelectField } from "../products/components/admin-select-field";

import {
  COUPON_STATUS_FILTERS,
  COUPON_STATUS_FILTER_LABELS,
  commercialHref,
  type CouponStatusFilter,
  type CouponsPageFilters,
} from "./commercial-config";

const SEARCH_DEBOUNCE_MS = 320;

const STATUS_OPTIONS: readonly SelectOption[] = COUPON_STATUS_FILTERS.map((value) => ({
  label: COUPON_STATUS_FILTER_LABELS[value],
  value,
}));

/** Base de 14rem: abaixo disso o `flex-wrap` quebra a linha em vez de espremer o select. */
const FILTER_FIELD = "min-w-0 flex-[1_1_14rem]";

export function CouponsFilterBar({ filters }: { filters: CouponsPageFilters }) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.search);
  const [urlSearch, setUrlSearch] = useState(filters.search);

  // Ajuste durante o render, e não num efeito: voltar no histórico troca a busca da URL e o campo
  // precisa acompanhar sem disparar uma renderização em cascata.
  if (filters.search !== urlSearch) {
    setUrlSearch(filters.search);
    setSearch(filters.search);
  }

  // A busca vive na URL, então cada tecla navegaria. O atraso agrupa a digitação numa navegação só.
  // A comparação usa o valor já aparado, o mesmo que a URL guarda: comparar o texto cru faria um
  // espaço no fim reabrir a navegação a cada render.
  const trimmedSearch = search.trim();

  useEffect(() => {
    if (trimmedSearch === urlSearch) {
      return;
    }

    const handle = window.setTimeout(() => {
      router.push(commercialHref("cupons", { ...filters, page: 1, search: trimmedSearch }), {
        scroll: false,
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [filters, router, trimmedSearch, urlSearch]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className={[FILTER_FIELD, "flex flex-col gap-2"].join(" ")}>
        <label
          className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
          htmlFor="coupons-search"
        >
          <span className="flex h-4 items-center gap-1.5">Busca</span>
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a1a1a]/45"
            strokeWidth={2.2}
          />
          <input
            className={[
              "h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white pl-9 pr-9 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
              FOCUS_RING,
            ].join(" ")}
            id="coupons-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Código do cupom"
            type="search"
            value={search}
          />
          {search ? (
            <button
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center text-[#1a1a1a]/55 transition hover:text-[#1a1a1a]"
              onClick={() => setSearch("")}
              type="button"
            >
              <X aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={FILTER_FIELD}>
        <AdminSelectField
          label="Situação"
          onChange={(value) =>
            router.push(
              commercialHref("cupons", {
                ...filters,
                page: 1,
                status: value as CouponStatusFilter,
              }),
              { scroll: false },
            )
          }
          options={STATUS_OPTIONS}
          placeholder="Selecione"
          value={filters.status}
          variant="vendor-create"
        />
      </div>
    </div>
  );
}
