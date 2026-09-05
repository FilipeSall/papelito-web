"use client";

import { FileClock, LayoutList, type LucideIcon } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import type {
  VendorOrderStatus,
  VendorOrdersFilters,
  VendorOrdersSummary,
} from "@/features/vendor-orders/types/vendor-orders";

import { VENDOR_ORDER_STATUS_ORDER, vendorOrderStatusShape } from "./order-status";

type Tile = {
  active: boolean;
  count: number;
  icon: LucideIcon;
  key: string;
  label: string;
  next: Pick<VendorOrdersFilters, "fiscal" | "status">;
};

/**
 * Contagem que também é filtro, no mesmo desenho do resumo de estoque.
 *
 * O número existe para levar a algum lugar: clicar em "Aguardando envio · 7"
 * abre exatamente esses sete pedidos. Sem isso o resumo viraria placar, e o
 * vendor teria que reconstruir o recorte à mão.
 */
function CountTile({
  active,
  count,
  icon: Icon,
  label,
  onSelect,
}: {
  active: boolean;
  count: number;
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-label={`${label}: ${count}`}
      aria-pressed={active}
      className={[
        "flex w-full items-center gap-3 border-2 px-3 py-2.5 text-left transition",
        FOCUS_RING,
        active
          ? "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow"
          : "border-[#1a1a1a]/15 bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-brand-yellow",
      ].join(" ")}
      onClick={onSelect}
      type="button"
    >
      <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
      <span className="min-w-0 flex-1 text-[10px] font-black uppercase leading-tight tracking-[0.14em]">
        {label}
      </span>
      <span className="text-base leading-none font-black tabular-nums">{count}</span>
    </button>
  );
}

/**
 * Fila de trabalho do vendor: cada situação vira um recorte, e a pendência de
 * nota fiscal aparece ao lado porque atravessa todas elas.
 *
 * As contagens vêm da carteira inteira, não da página, e são calculadas antes
 * do filtro de situação — então uma ficha continua dizendo quantos pedidos
 * existem naquela fila mesmo enquanto outra está ativa.
 */
export function VendorOrdersSummaryPanel({
  filters,
  onSelect,
  summary,
}: {
  filters: VendorOrdersFilters;
  onSelect: (next: Pick<VendorOrdersFilters, "fiscal" | "status">) => void;
  summary: VendorOrdersSummary;
}) {
  const statusTiles: Tile[] = [
    {
      active: filters.status === "all" && filters.fiscal === "all",
      count: summary.all,
      icon: LayoutList,
      key: "all",
      label: "Todos",
      next: { fiscal: "all", status: "all" },
    },
    ...VENDOR_ORDER_STATUS_ORDER.map((status: VendorOrderStatus) => {
      const shape = vendorOrderStatusShape(status);

      return {
        active: filters.status === status && filters.fiscal === "all",
        count: summary[status],
        icon: shape.icon,
        key: status,
        label: shape.label,
        next: { fiscal: "all" as const, status },
      };
    }),
  ];

  return (
    <section
      aria-labelledby="vendor-orders-summary-title"
      className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
    >
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <h2
        className="border-b-2 border-[#1a1a1a] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55"
        id="vendor-orders-summary-title"
      >
        Fila de trabalho
      </h2>

      <div className="px-5 py-5">
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {statusTiles.map((tile) => (
            <li key={tile.key}>
              <CountTile
                active={tile.active}
                count={tile.count}
                icon={tile.icon}
                label={tile.label}
                onSelect={() => onSelect(tile.next)}
              />
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t-2 border-[#1a1a1a]/10 pt-4">
          <div className="sm:max-w-xs">
            <CountTile
              active={filters.fiscal === "pending"}
              count={summary.fiscal_pending}
              icon={FileClock}
              label="Pagos sem nota fiscal"
              onSelect={() =>
                onSelect(
                  filters.fiscal === "pending"
                    ? { fiscal: "all", status: filters.status }
                    : { fiscal: "pending", status: "all" },
                )
              }
            />
          </div>
          <p className="mt-2 max-w-lg text-xs leading-5 text-[#231f20]/62">
            Recorte que atravessa as situações: pedidos já pagos e não cancelados em que a nota
            ainda não foi anexada.
          </p>
        </div>
      </div>
    </section>
  );
}
