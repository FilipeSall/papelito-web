import { RevendedorSelectOption } from "@/features/revendedor";
import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";

type RevendedorFormSelectFieldProps = {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly RevendedorSelectOption[];
  placeholder?: string;
  tone?: "light" | "dark";
  value: string;
};

/**
 * Agrupa label, select e mensagem de erro para campos de escolha única.
 */
export function RevendedorFormSelectField({
  error,
  label,
  onChange,
  options,
  placeholder = "Selecione",
  tone = "light",
  value,
}: RevendedorFormSelectFieldProps) {
  const normalizedOptions = options.filter((option) => option.value !== "");

  if (tone === "dark") {
    return (
      <CheckoutCustomSelect
        errorClassName="min-h-5 text-[11px] tracking-[0.05px] text-red-300"
        errorMessage={error}
        iconClassName="text-white/60"
        label={label}
        labelClassName="text-[11px] font-black uppercase tracking-[0.24em] text-white/45"
        listClassName="!border-white/10 !bg-[#2b2527] shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
        options={normalizedOptions}
        optionClassName="rounded-none"
        placeholder={placeholder}
        placeholderClassName="text-white/45"
        selectedOptionClassName="!bg-brand-yellow !text-brand-dark"
        selectedValueClassName="text-white"
        triggerClassName={`h-12 rounded-xl border bg-white/10 ${
          error
            ? "border-red-400 focus:border-red-400"
            : "border-white/20 focus:border-brand-yellow"
        }`}
        unselectedOptionClassName="!text-white hover:!bg-white/10"
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <CheckoutCustomSelect
      errorMessage={error}
      label={label}
      labelClassName="text-xs font-black uppercase tracking-[0.6px] text-brand-dark"
      options={normalizedOptions}
      placeholder={placeholder}
      triggerClassName="focus:border-brand-yellow"
      value={value}
      onChange={onChange}
    />
  );
}
