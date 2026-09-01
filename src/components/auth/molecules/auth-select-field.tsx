"use client";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";

export type AuthSelectOption = {
  label: string;
  searchText?: string;
  triggerLabel?: string;
  value: string;
};

interface AuthSelectFieldProps {
  disabled?: boolean;
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: readonly AuthSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  value: string;
}

/**
 * Campo de escolha única no contexto público escuro (login, cadastro).
 * Usa o select padrão do projeto e mantém um input oculto com o `name`, porque
 * os formulários de cadastro leem o valor por `FormData` no submit.
 */
export function AuthSelectField({
  disabled = false,
  error,
  label,
  name,
  onChange,
  options,
  placeholder = "Selecione",
  searchable = false,
  value,
}: Readonly<AuthSelectFieldProps>) {
  return (
    <div className="flex flex-col gap-2">
      <CheckoutCustomSelect
        disabled={disabled}
        errorClassName="min-h-5 text-[11px] tracking-[0.05px] text-red-300"
        errorMessage={error}
        iconClassName="text-white/60"
        label={label}
        labelClassName="text-xs font-medium uppercase tracking-widest text-white/70"
        listClassName="!border-white/10 !bg-[#2b2527] shadow-[6px_6px_0px_rgba(0,0,0,0.45)]"
        optionClassName="rounded-none"
        options={options}
        placeholder={placeholder}
        placeholderClassName="text-white/30"
        searchable={searchable}
        searchInputClassName="h-9 w-full rounded-[10px] border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-yellow"
        selectedOptionClassName="!bg-brand-yellow !text-brand-dark"
        selectedValueClassName="text-white"
        triggerClassName={`h-12 rounded-xl border bg-white/10 ${
          error ? "border-red-400 focus:border-red-400" : "border-white/20 focus:border-brand-yellow"
        }`}
        unselectedOptionClassName="!text-white hover:!bg-white/10"
        value={value}
        onChange={onChange}
      />
      <input name={name} type="hidden" value={value} />
    </div>
  );
}
