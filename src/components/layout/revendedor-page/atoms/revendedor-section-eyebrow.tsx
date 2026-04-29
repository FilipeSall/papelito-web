type RevendedorSectionEyebrowProps = {
  children: React.ReactNode;
  tone?: "dark" | "light";
};

/**
 * Renderiza o pequeno texto em caixa alta usado para introduzir cada secao.
 */
export function RevendedorSectionEyebrow({
  children,
  tone = "dark",
}: RevendedorSectionEyebrowProps) {
  const toneClass =
    tone === "light" ? "text-brand-yellow" : "text-brand-dark/40";

  return (
    <span className={`text-xs font-black uppercase tracking-[1.2px] ${toneClass}`}>
      {children}
    </span>
  );
}
