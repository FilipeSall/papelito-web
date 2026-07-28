"use client";

import { useState } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";

const GRANULARITY_OPTIONS = [
  { label: "Dia", value: "day" },
  { label: "Semana", value: "week" },
  { label: "Mês", value: "month" },
] as const;

export function AdminSalesGranularitySelect({
  defaultValue,
}: {
  defaultValue: "day" | "week" | "month";
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="group relative z-40 w-35 shrink-0">
      <input name="interval" type="hidden" value={value} />
      <div className="relative">
        <CheckoutCustomSelect
          label=""
          labelClassName="hidden"
          options={GRANULARITY_OPTIONS}
          placeholder="Selecione"
          triggerClassName="h-[44px] rounded-[14px] border-[#231f20]/14 bg-white text-[#231f20] focus:border-[#231f20]"
          value={value}
          onChange={(nextValue) => {
            if (nextValue === "day" || nextValue === "week" || nextValue === "month") {
              setValue(nextValue);
            }
          }}
        />
        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#231f20] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          granularidade
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#231f20]" />
        </span>
      </div>
    </div>
  );
}
