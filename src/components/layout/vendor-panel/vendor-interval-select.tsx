"use client";

import { useState } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";

const INTERVAL_OPTIONS = [
  { label: "Dia", value: "day" },
  { label: "Semana", value: "week" },
  { label: "Mes", value: "month" },
] as const;

type VendorIntervalSelectProps = {
  defaultValue: "day" | "week" | "month";
};

export function VendorIntervalSelect({ defaultValue }: VendorIntervalSelectProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="min-w-40">
      <input name="interval" type="hidden" value={value} />
      <CheckoutCustomSelect
        label=""
        labelClassName="hidden"
        options={INTERVAL_OPTIONS}
        placeholder="Selecione"
        triggerClassName="min-h-9 rounded-[8px] border-brand-dark/18 bg-white text-brand-dark"
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
