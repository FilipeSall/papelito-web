type RevendedorRadioPillProps = {
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
  tone?: "light" | "dark";
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
  tone = "light",
  value,
}: RevendedorRadioPillProps) {
  const uncheckedClasses =
    tone === "dark"
      ? "border-white/20 bg-white/10 text-white/70"
      : "border-[#E5E7EB] bg-white text-text-muted";

  return (
    <label
      className={`flex h-11.5 flex-1 cursor-pointer items-center justify-center rounded-3.5 border-2 transition-colors ${
        checked
          ? "border-brand-yellow bg-brand-yellow text-brand-dark"
          : uncheckedClasses
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
