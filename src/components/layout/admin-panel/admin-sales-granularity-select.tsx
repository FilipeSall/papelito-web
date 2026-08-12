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
    <div className="relative z-40 w-35 shrink-0">
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
      </div>
    </div>
  );
}
