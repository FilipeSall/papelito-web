"use client";

import CountUp from "react-countup";

const CURRENCY = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatDelta(rate: number) {
  const sign = rate > 0 ? "+" : rate < 0 ? "−" : "";
  return `${sign}${Math.abs(rate).toFixed(1).replace(".", ",")}%`;
}

export function SalesHeadline({
  deltaRate,
  grossRevenue,
  label = "Receita bruta",
  netRevenue,
  periodLabel,
  previousGrossRevenue,
  previousPeriodLabel,
}: Readonly<{
  deltaRate: number | null;
  grossRevenue: number;
  label?: string;
  netRevenue?: number;
  periodLabel: string;
  previousGrossRevenue: number | null;
  previousPeriodLabel: string;
}>) {
  const hasComparison = deltaRate !== null;

  return (
    <dl>
      <dt className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/62">
        {label} · {periodLabel}
      </dt>
      <dd
        className="mt-3 text-[clamp(2.5rem,7vw,4rem)] font-bold leading-[0.86] tracking-[-0.04em] tabular-nums text-[#1a1a1a]"
        style={{ fontFamily: "var(--font-admin-display)" }}
      >
        <CountUp
          decimals={0}
          duration={1.1}
          end={grossRevenue}
          formattingFn={(value) => CURRENCY.format(value)}
          preserveValue
          useEasing
        />
      </dd>

      <dd className="mt-4">
        {hasComparison ? (
          <span className="flex flex-wrap items-center gap-2 text-sm leading-6 text-[#1a1a1a]/72">
            <span
              className={[
                "inline-flex items-center border-2 border-[#1a1a1a] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] tabular-nums",
                deltaRate >= 0
                  ? "bg-brand-yellow text-[#1a1a1a]"
                  : "bg-[#c0392b] text-white",
              ].join(" ")}
            >
              {formatDelta(deltaRate)}
            </span>
            <span>
              contra {CURRENCY.format(previousGrossRevenue ?? 0)} no período anterior
              {previousPeriodLabel ? ` (${previousPeriodLabel})` : ""}
            </span>
          </span>
        ) : (
          <span className="block border-2 border-dashed border-[#1a1a1a]/35 px-3 py-2 text-sm leading-6 text-[#1a1a1a]/72">
            Sem base de comparação: o período anterior
            {previousPeriodLabel ? ` (${previousPeriodLabel})` : ""} não registrou vendas neste
            recorte.
          </span>
        )}
      </dd>

      {netRevenue === undefined ? null : (
        <dd className="mt-4 border-t-2 border-dashed border-[#1a1a1a]/28 pt-4 text-sm leading-6 text-[#1a1a1a]/72">
          Líquida, já descontados frete, impostos e reembolsos:{" "}
          <span className="font-semibold tabular-nums text-[#1a1a1a]">
            {CURRENCY.format(netRevenue)}
          </span>
        </dd>
      )}
    </dl>
  );
}
