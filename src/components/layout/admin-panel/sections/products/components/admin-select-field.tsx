"use client";

import { InfoTooltip } from "./form-fields";
import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import type { SelectOption } from "@/types/admin-products-manager";

type AdminSelectFieldProps = {
  helpText?: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder: string;
  value: string;
  variant?: "filter" | "modal";
};

export function AdminSelectField({
  helpText,
  label,
  onChange,
  options,
  placeholder,
  value,
  variant = "modal",
}: AdminSelectFieldProps) {
  if (variant === "filter") {
    return (
      <CheckoutCustomSelect
        label={
          <span className="flex items-center gap-2">
            <span className="leading-none">{label}</span>
            {helpText ? <InfoTooltip text={helpText} /> : null}
          </span>
        }
        labelClassName="text-[11px] font-semibold uppercase tracking-[0.18em] leading-none text-[#756d5f]"
        listClassName="z-[90] rounded-[18px] border border-[#d6ccb6] shadow-[0_18px_32px_rgba(35,31,32,0.12)]"
        onChange={onChange}
        optionClassName="tracking-normal"
        options={options}
        placeholder={placeholder}
        triggerClassName="h-12 min-h-0 rounded-[14px] border border-[#d6ccb6] bg-white px-4 text-sm font-medium tracking-normal text-[#231f20] focus:border-[#231f20] focus:ring-1 focus:ring-[#231f20]"
        value={value}
      />
    );
  }

  return (
    <CheckoutCustomSelect
      label={
        <span className="flex items-center gap-2">
          <span className="leading-none">{label}</span>
          {helpText ? <InfoTooltip text={helpText} /> : null}
        </span>
      }
      labelClassName="text-sm font-medium leading-none text-[#231f20]"
      listClassName="z-[90] border border-[#231f20] shadow-[0_12px_28px_rgba(35,31,32,0.14)]"
      onChange={onChange}
      optionClassName="tracking-normal"
      options={options}
      placeholder={placeholder}
      triggerClassName="min-h-12 rounded-none border border-[#c9bd96] bg-white px-5 text-base tracking-normal focus:border-[#231f20]"
      value={value}
    />
  );
}
