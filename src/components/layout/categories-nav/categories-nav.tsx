"use client";

import useEmblaCarousel from "embla-carousel-react";
import { CategoryNavItem } from "./category-nav-item";
import { CATEGORIES_NAV_ITEMS } from "./constants";

/**
 * Barra de navegação por categoria exibida abaixo da barra de benefícios.
 *
 * Apresenta quatro cards clicáveis — Kits, Premium, Promoções e Novidades —
 * em layout horizontal com gap uniforme e sombra aplicada ao conjunto.
 */
export function CategoriesNav() {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  return (
    <section className="w-full bg-white py-3 lg:bg-[#F9FAFB] lg:pt-8 lg:pb-[25px]">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div
          ref={emblaRef}
          className="overflow-hidden pb-0.5 lg:hidden"
          aria-label="Carrossel de categorias"
        >
          <div className="flex gap-3.5 pr-4">
            {CATEGORIES_NAV_ITEMS.map((item) => (
              <div key={item.title} className="min-w-0 shrink-0 basis-[46%]">
                <CategoryNavItem
                  emoji={item.emoji}
                  title={item.title}
                  subtitle={item.subtitle}
                  href={item.href}
                  className="h-27 max-w-none px-4"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden justify-center gap-12 lg:grid lg:grid-cols-[repeat(4,186px)] lg:drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]">
          {CATEGORIES_NAV_ITEMS.map((item) => (
            <CategoryNavItem
              key={item.title}
              emoji={item.emoji}
              title={item.title}
              subtitle={item.subtitle}
              href={item.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
