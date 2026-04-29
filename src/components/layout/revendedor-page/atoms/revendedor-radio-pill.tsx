type RevendedorRadioPillProps = {
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
  value: string;
};

/**
 * Opcao visual do radio binario usado no campo "Já vende produtos Papelito?".
 */
export function RevendedorRadioPill({
  checked,
  label,
  name,
  onChange,
  value,
}: RevendedorRadioPillProps) {
  return (
    <label
      className={`flex h-12 flex-1 cursor-pointer items-center justify-center rounded-3.5 border-2 transition-colors ${
        checked
          ? "border-brand-yellow bg-brand-yellow text-brand-dark"
          : "border-[#E5E7EB] bg-white text-text-muted"
      }`}
    >
      <input
        checked={checked}
        className="sr-only"
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span className="text-sm font-black uppercase tracking-[-0.1504px]">
        {label}
      </span>
    </label>
  );
}
