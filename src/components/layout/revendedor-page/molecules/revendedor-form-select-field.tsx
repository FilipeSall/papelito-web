import { RevendedorSelectOption } from "@/features/revendedor";
import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { RevendedorFormLabel } from "../atoms/revendedor-form-label";

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
  if (tone === "dark") {
    const selectId = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    return (
      <div className="flex flex-col gap-1.5">
        <RevendedorFormLabel htmlFor={selectId} tone="dark">
          {label}
        </RevendedorFormLabel>
        <select
          aria-describedby={error ? `${selectId}-error` : undefined}
          aria-invalid={Boolean(error)}
          className={`h-12 w-full appearance-none rounded-xl border bg-white/10 px-4 text-sm text-white transition focus:outline-none focus:ring-1 ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-400/40"
              : "border-white/20 focus:border-brand-yellow focus:ring-brand-yellow"
          }`}
          id={selectId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option className="text-brand-dark" key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          id={`${selectId}-error`}
          className="min-h-5 text-[11px] tracking-[0.05px] text-red-300"
        >
          {error ?? ""}
        </span>
      </div>
    );
  }

  return (
    <CheckoutCustomSelect
      errorMessage={error}
      label={label}
      labelClassName="text-xs font-black uppercase tracking-[0.6px] text-brand-dark"
      options={options}
      placeholder={placeholder}
      triggerClassName="focus:border-brand-yellow"
      value={value}
      onChange={onChange}
    />
  );
}
