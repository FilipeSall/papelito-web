import { PROMO_ITEMS } from "./constants";

export function PromoMarquee() {
  const doubled = [...PROMO_ITEMS, ...PROMO_ITEMS];

  return (
    <div className="overflow-hidden h-8 bg-white flex items-center">
      <div className="flex whitespace-nowrap animate-marquee">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="px-8 text-xs font-black uppercase tracking-[0.6px] text-[#231F20] leading-4"
          >
            {item.emoji} {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
