/**
 * Classes de ação da camada dura: borda de 2px, canto reto e sombra com offset sem blur.
 *
 * Vivem em `ui/` porque as três superfícies de painel — comprador, vendor e admin — usam as
 * mesmas classes, e um componente compartilhado não pode importar de `layout/<rota>/`.
 * `profile-panel.tsx` re-exporta sob os nomes históricos.
 */
export const hardPrimaryActionClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow";

export const hardSecondaryActionClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transition-shadow hover:shadow-[1px_1px_0px_#1a1a1a] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

export const hardQuietActionClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a]/25 bg-transparent px-5 text-xs font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a] hover:text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

export const hardDangerActionClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#c0392b] bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-[#c0392b] shadow-[3px_3px_0px_#c0392b] transition-shadow hover:shadow-[1px_1px_0px_#c0392b] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]";
