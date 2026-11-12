type SectionLabelProps = {
  id?: string;
  children: string;
};

/** Legenda de seção em caixa alta (13/800). Renderiza h2 para manter o heading acessível. */
export function SectionLabel({ id, children }: Readonly<SectionLabelProps>) {
  return (
    <h2 id={id} className="text-[13px] font-extrabold uppercase tracking-[0.08em]">
      {children}
    </h2>
  );
}
