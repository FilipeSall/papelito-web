import { RevendedorSelectOption } from "@/features/revendedor";
import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";

type RevendedorFormSelectFieldProps = {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly RevendedorSelectOption[];
  placeholder?: string;
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
  value,
}: RevendedorFormSelectFieldProps) {
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
