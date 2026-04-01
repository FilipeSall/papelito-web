/**
 * Tag atômica para exibir rótulos superiores em banners.
 *
 * Utilizada para exibir textos de destaque como "🤝 Seja um Parceiro"
 * com estilo de texto pequeno, uppercase e espaçamento de letras.
 *
 * @example
 * ```tsx
 * <PartnerBannerTag>🤝 Seja um Parceiro</PartnerBannerTag>
 * ```
 */
export function PartnerBannerTag({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-black text-xs leading-4 tracking-[1.2px] uppercase text-brand-dark/60">
      {children}
    </p>
  );
}
