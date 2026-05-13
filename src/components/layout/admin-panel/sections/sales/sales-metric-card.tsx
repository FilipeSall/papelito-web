"use client";

import CountUp from "react-countup";

type SalesMetricCardProps = {
  animationDelayMs?: number;
  detail: string;
  format: "currency" | "number";
  label: string;
  tone?: "default" | "warning";
  value: number;
};

function formatValue(value: number, format: SalesMetricCardProps["format"]) {
  return new Intl.NumberFormat("pt-BR", {
    ...(format === "currency"
      ? {
          currency: "BRL",
          style: "currency",
        }
      : {}),
    maximumFractionDigits: 0,
  }).format(value);
}

export function SalesMetricCard({
  animationDelayMs = 0,
  detail,
  format,
  label,
  tone = "default",
  value,
}: SalesMetricCardProps) {
  return (
    <section
      className="animate-admin-panel-enter relative min-h-[108px] overflow-hidden rounded-[12px] border border-[#231f20]/18 bg-white p-4 text-[#231f20]"
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      <div
        aria-hidden
        className={[
          "absolute left-0 top-0 h-1 w-full",
          tone === "warning" ? "bg-[#ffe500]" : "bg-[#231f20]/18",
        ].join(" ")}
      />
      <p className="text-sm font-semibold text-[#231f20]/82">{label}</p>
      <p
        className="mt-3 text-[1.45rem] font-semibold leading-none tracking-normal text-[#231f20]"
        style={{ fontFamily: "var(--font-admin-display)" }}
      >
        <CountUp
          decimals={0}
          duration={1.35}
          end={value}
          formattingFn={(nextValue) => formatValue(nextValue, format)}
          preserveValue
          useEasing
        />
      </p>
      <p className="mt-3 text-sm leading-5 text-[#231f20]/62">{detail}</p>
    </section>
  );
}
