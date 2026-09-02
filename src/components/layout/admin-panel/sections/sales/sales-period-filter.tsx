import {
  buildAdminSalesFilterQuery,
  type parseAdminSalesFilters,
} from "@/lib/server/admin-sales-filters";

import { FOCUS_RING } from "../../primitives";
import { SalesPresetLink } from "./sales-preset-link";

const PRESET_LINKS: ReadonlyArray<{
  label: string;
  preset: "1y" | "30d" | "7d" | "month";
}> = [
  { label: "7 dias", preset: "7d" },
  { label: "30 dias", preset: "30d" },
  { label: "Mês atual", preset: "month" },
  { label: "1 ano", preset: "1y" },
];

const DATE_INPUT_CLASS = [
  "min-h-11 w-full min-w-0 rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm font-semibold tabular-nums text-[#1a1a1a] sm:w-40",
  FOCUS_RING,
].join(" ");

const FIELD_LABEL_CLASS =
  "text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62";

export function SalesPeriodFilter({
  basePath = "/admin/sales",
  className,
  filters,
}: Readonly<{
  basePath?: string;
  className?: string;
  filters: ReturnType<typeof parseAdminSalesFilters>;
}>) {
  return (
    <div
      className={["flex flex-col gap-4 xl:flex-row xl:items-end", className ?? ""].join(" ")}
    >
      <div className="flex flex-wrap gap-2">
        {PRESET_LINKS.map((item) => (
          <SalesPresetLink
            active={filters.preset === item.preset}
            href={`${basePath}?${buildAdminSalesFilterQuery(filters, {
              page: 1,
              preset: item.preset,
            })}`}
            key={item.preset}
            label={item.label}
          />
        ))}
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end xl:ml-auto"
        key={`${filters.from}-${filters.to}-${filters.interval}`}
        method="get"
      >
        <input name="preset" type="hidden" value="custom" />
        <div className="grid items-end gap-3 min-[380px]:grid-cols-2 sm:flex sm:gap-3">
          <label className="grid gap-2">
            <span className={FIELD_LABEL_CLASS}>De</span>
            <input
              className={DATE_INPUT_CLASS}
              defaultValue={filters.from}
              name="from"
              type="date"
            />
          </label>
          <label className="grid gap-2">
            <span className={FIELD_LABEL_CLASS}>Até</span>
            <input
              className={DATE_INPUT_CLASS}
              defaultValue={filters.to}
              name="to"
              type="date"
            />
          </label>
        </div>
        <button
          className={[
            "inline-flex min-h-11 w-full items-center justify-center rounded-none border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.16em] text-brand-yellow transition-colors hover:bg-[#000] sm:w-auto",
            FOCUS_RING,
          ].join(" ")}
          type="submit"
        >
          Aplicar
        </button>
      </form>
    </div>
  );
}
