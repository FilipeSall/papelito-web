import type { PromoMarqueeItem } from "@/types/home-assets";

export const PROMO_MARQUEE_MIN_ACTIVE_MESSAGES = 3;
export const PROMO_MARQUEE_MAX_LENGTH = 120;

/** Fallback de compatibilidade durante a implantação do endpoint no WordPress. */
export const PROMO_ITEMS: PromoMarqueeItem[] = [
  { id: "fallback-marquee-1", text: "⚡ COMPRE 3 LEVE 4 em Sedas", order: 1, isActive: true },
  { id: "fallback-marquee-2", text: "🌿 Hemp King Size com 20% OFF", order: 2, isActive: true },
  { id: "fallback-marquee-3", text: "🎁 BRINDE em pedidos acima de R$500", order: 3, isActive: true },
  { id: "fallback-marquee-4", text: "💳 PARCELAMOS em 3x sem juros", order: 4, isActive: true },
  {
    id: "fallback-marquee-5",
    text: "🏆 A #1 DO BRASIL em papéis para enrolar",
    order: 5,
    isActive: true,
  },
  { id: "fallback-marquee-6", text: "🔥 FRETE GRÁTIS acima de R$79", order: 6, isActive: true },
];
