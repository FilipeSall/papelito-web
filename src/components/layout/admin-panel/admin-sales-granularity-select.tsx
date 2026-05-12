"use client";

import { useState } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";

const GRANULARITY_OPTIONS = [
  { label: "Dia", value: "day" },
  { label: "Semana", value: "week" },
  { label: "Mes", value: "month" },
] as const;

export function AdminSalesGranularitySelect({
  defaultValue,
}: {
  defaultValue: "day" | "week" | "month";
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="relative z-40 space-y-2">
      <input name="interval" type="hidden" value={value} />
      <CheckoutCustomSelect
        label="granularidade"
        labelClassName="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48"
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
    </div>
  );
}
