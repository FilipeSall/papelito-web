import Link from "next/link";
import { FileWarning, type LucideIcon } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import type {
  VendorStockFilter,
  VendorStockFilters,
  VendorStockSummary,
} from "@/features/vendor-stock/types/vendor-stock";

import { buildStockHref } from "./stock-href";
import { stockLevelShape } from "./stock-status";

/**
 * Anel de cobertura no mesmo desenho do donut de vendas do painel: `conic-gradient` num círculo
 * de borda 2px, com o miolo vazado por outra borda. Um SVG novo daria ao vendor um segundo
 * idioma de gráfico dentro do mesmo produto.
 */
function CoverageDial({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div
      aria-label={`Cobertura do catálogo: ${Math.round(clamped)}%`}
      className="animate-admin-donut-in relative h-32 w-32 shrink-0 rounded-full border-2 border-[#1a1a1a]"
      role="img"
      style={{
        background: `conic-gradient(#ffe500 0% ${clamped}%, #faf8f2 ${clamped}% 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-[13px] flex flex-col items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-white"
      >
        <span className="text-2xl leading-none font-black tabular-nums text-[#1a1a1a]">
          {Math.round(clamped)}%
        </span>
        <span className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/60">
          cobertura
        </span>
      </div>
    </div>
  );
}

/**
 * Contagem que também é filtro.
 *
 * O número existe para levar a algum lugar: clicar em "Sem estoque · 7" abre exatamente esses
 * sete produtos. Sem isso o resumo viraria placar decorativo e o vendor teria que reconstruir o
 * recorte à mão no drawer.
 */
function CountLink({
  active,
  count,
  filters,
  icon: Icon,
  label,
  target,
}: {
  active: boolean;
  count: number;
  filters: VendorStockFilters;
  icon: LucideIcon;
  label: string;
  target: VendorStockFilter;
}) {
  return (
    <Link
      // O rótulo e o número são elementos vizinhos, e sem `aria-label` o leitor de tela juntaria
      // os dois sem pausa — "Estoque baixo18".
      aria-label={`${label}: ${count}`}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex items-center gap-3 border-2 px-3 py-2.5 transition",
        FOCUS_RING,
        active
          ? "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow"
          : "border-[#1a1a1a]/15 bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-brand-yellow",
      ].join(" ")}
      href={buildStockHref({ ...filters, filter: target })}
    >
      <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
      <span className="min-w-0 flex-1 text-[10px] font-black uppercase tracking-[0.14em]">
        {label}
      </span>
      <span className="text-base leading-none font-black tabular-nums">{count}</span>
    </Link>
  );
}

/**
 * Situação do catálogo do vendor: a cobertura como único gráfico e, ao lado, cada contagem como
 * atalho para o recorte correspondente.
 *
 * Deliberadamente não é uma fileira de cards de KPI: os números aqui são navegação, e a única
 * medida que pede desenho próprio é a cobertura.
 */
export function StockSummary({
  filters,
  summary,
}: {
  filters: VendorStockFilters;
  summary: VendorStockSummary;
}) {
  const isKits = filters.type === "kits";
  const counts: Array<{
    count: number;
    icon: LucideIcon;
    label: string;
    target: VendorStockFilter;
  }> = [
    {
      count: summary.available,
      icon: stockLevelShape("available").icon,
      label: stockLevelShape("available").label,
      target: "with_stock",
    },
    {
      count: summary.lowStock,
      icon: stockLevelShape("low").icon,
      label: stockLevelShape("low").label,
      target: "low_stock",
    },
    {
      count: summary.outOfStock,
      icon: stockLevelShape("out").icon,
      label: stockLevelShape("out").label,
      target: "zeroed_only",
    },
  ];

  // Kit não tem saldo próprio para lançar, e o cadastro dele é checado no editor de kits: as duas
  // contagens não existiriam no segmento de kits, e mostrá-las zeradas mentiria sobre o domínio.
  if (!isKits) {
    counts.push(
      {
        count: summary.unconfigured,
        icon: stockLevelShape("unconfigured").icon,
        label: stockLevelShape("unconfigured").label,
        target: "unconfigured",
      },
      {
        count: summary.incomplete,
        icon: FileWarning,
        label: "Dados incompletos",
        target: "incomplete",
      },
    );
  }

  return (
    <section
      aria-labelledby="stock-summary-title"
      className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
    >
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <h2
        className="border-b-2 border-[#1a1a1a] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55"
        id="stock-summary-title"
      >
        {isKits ? "Situação dos seus kits" : "Situação do seu catálogo"}
      </h2>

      <div className="flex flex-col gap-6 px-5 py-5 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <CoverageDial percent={summary.coveragePercent} />
          <div className="min-w-0">
            <p className="text-sm leading-6 font-bold text-[#1a1a1a]">
              {summary.available} de {summary.eligible}{" "}
              {isKits ? (summary.eligible === 1 ? "kit" : "kits") : "SKUs"} disponíveis
            </p>
            <p className="mt-1 max-w-64 text-xs leading-5 text-[#231f20]/64">
              Cobertura é quanto do catálogo você tem para vender — não o tamanho do seu estoque.
            </p>
            {/* Uma explicação visível para todo mundo em vez de cinco tooltips escondidos. */}
            <p className="mt-2 max-w-64 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]/50">
              Estoque baixo: até {summary.lowStockThreshold}{" "}
              {summary.lowStockThreshold === 1 ? "unidade" : "unidades"}
            </p>
          </div>
        </div>

        <ul className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {counts.map((entry) => (
            <li key={entry.target}>
              <CountLink
                active={filters.filter === entry.target}
                count={entry.count}
                filters={filters}
                icon={entry.icon}
                label={entry.label}
                target={entry.target}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
