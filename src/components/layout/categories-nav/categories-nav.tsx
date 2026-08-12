"use client";

import useEmblaCarousel from "embla-carousel-react";

import { CategoryNavItem } from "./category-nav-item";
import { CATEGORIES_NAV_ITEMS } from "./constants";

export function CategoriesNav() {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  return (
    <section className="w-full bg-[#f9fafb] py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="mb-4 flex items-center gap-3 sm:mb-5">
          <span aria-hidden className="h-2.5 w-2.5 rotate-45 bg-brand-yellow" />
          <h2 className="text-xs font-black uppercase tracking-[0.18em] text-brand-dark sm:text-sm">
            Explore por coleção
          </h2>
        </div>
        <div
          ref={emblaRef}
          aria-label="Carrossel de coleções"
          className="overflow-hidden px-0.5 pb-2 lg:hidden"
        >
          <div className="flex gap-4 pr-4">
            {CATEGORIES_NAV_ITEMS.map((item) => (
              <div
                key={item.title}
                className="min-w-0 shrink-0 basis-[78%] min-[480px]:basis-[46%]"
              >
                <CategoryNavItem {...item} className="max-w-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-4 gap-5 lg:grid">
          {CATEGORIES_NAV_ITEMS.map((item) => (
            <CategoryNavItem key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
