type SectionLabelProps = {
  id?: string;
  children: string;
};

/**
 * Legenda de seção do handoff: filete em cima, a legenda em caixa alta e, quando vem,
 * a letra da seção. Renderiza h2 para manter o heading acessível.
 */
export function SectionLabel({ id, children }: Readonly<SectionLabelProps>) {
  return (
    <h2 id={id} className="flex h-8 items-end gap-2.5 border-t border-expo-ink text-[18px] font-bold uppercase">
      {children}
    </h2>
  );
}
