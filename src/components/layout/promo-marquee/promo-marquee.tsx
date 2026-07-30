import type { PromoMarqueeItem } from "@/types/home-assets";

import { PROMO_MARQUEE_MIN_ACTIVE_MESSAGES } from "./constants";

/**
 * Faixa promocional com scroll infinito exibida abaixo do header.
 *
 * Renderiza os itens recebidos duplicados em uma única faixa flex,
 * animando de `translateX(0)` até `translateX(-50%)` para criar um loop
 * contínuo e sem quebras visíveis.
 *
 * A animação é controlada pela classe `.animate-marquee` definida em `globals.css`.
 */
export function PromoMarquee({ items }: { items: PromoMarqueeItem[] }) {
  const activeItems = items.filter((item) => item.isActive && item.text.trim() !== "");

  if (activeItems.length < PROMO_MARQUEE_MIN_ACTIVE_MESSAGES) {
    return null;
  }

  const doubled = [...activeItems, ...activeItems];

  return (
    <div className="h-8">
      <div className="fixed inset-x-0 top-[60px] z-40 flex h-8 items-center overflow-hidden bg-white md:top-23.25">
        <div className="flex whitespace-nowrap animate-marquee">
          {doubled.map((item, i) => (
            <span
              key={`${item.id}-${i}`}
              className="px-8 text-xs font-black uppercase leading-4 tracking-[0.6px] text-[#231F20]"
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
