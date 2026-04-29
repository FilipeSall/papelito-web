type RevendedorFormLabelProps = {
  children: React.ReactNode;
  htmlFor: string;
};

/**
 * Padroniza o label dos campos do formulario da landing de revendedor.
 */
export function RevendedorFormLabel({
  children,
  htmlFor,
}: RevendedorFormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-black uppercase tracking-[0.6px] text-brand-dark"
    >
      {children}
    </label>
  );
}
