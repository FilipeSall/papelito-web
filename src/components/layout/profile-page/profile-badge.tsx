type ProfileBadgeProps = {
  label: string;
};

/**
 * Etiqueta de status do comprador, em amarelo sólido com recorte duro.
 */
export function ProfileBadge({ label }: ProfileBadgeProps) {
  return (
    <span className="inline-flex h-6 items-center border-2 border-brand-yellow bg-brand-yellow px-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-brand-dark">
      {label}
    </span>
  );
}
