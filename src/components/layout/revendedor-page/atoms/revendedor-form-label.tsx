type RevendedorFormLabelProps = {
  children: React.ReactNode;
  htmlFor: string;
  tone?: "light" | "dark";
};

/**
 * Padroniza o label dos campos do formulario da landing de revendedor.
 */
export function RevendedorFormLabel({
  children,
  htmlFor,
  tone = "light",
}: RevendedorFormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={
        tone === "dark"
          ? "text-xs font-medium uppercase tracking-widest text-white/70"
          : "text-xs font-black uppercase tracking-[0.6px] text-brand-dark"
      }
    >
      {children}
    </label>
  );
}
