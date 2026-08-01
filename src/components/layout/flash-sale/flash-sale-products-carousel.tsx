"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { HomeProductCard } from "@/features/catalog";

import { ProductCard } from "./product-card";

type FlashSaleProductsCarouselProps = {
  products: HomeProductCard[];
};

export function FlashSaleProductsCarousel({
  products,
}: Readonly<FlashSaleProductsCarouselProps>) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const syncControls = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const frame = requestAnimationFrame(syncControls);
    emblaApi.on("select", syncControls);
    emblaApi.on("reInit", syncControls);

    return () => {
      cancelAnimationFrame(frame);
      emblaApi.off("select", syncControls);
      emblaApi.off("reInit", syncControls);
    };
  }, [emblaApi, syncControls]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          aria-label="Produtos anteriores da oferta relâmpago"
          className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-yellow/30 bg-white/6 text-brand-yellow shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition hover:border-brand-yellow hover:bg-brand-yellow hover:text-brand-dark disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/3 disabled:text-white/18"
          disabled={!canScrollPrev}
          onClick={scrollPrev}
          type="button"
        >
          <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.2} />
        </button>
        <button
          aria-label="Próximos produtos da oferta relâmpago"
          className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-yellow/30 bg-white/6 text-brand-yellow shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition hover:border-brand-yellow hover:bg-brand-yellow hover:text-brand-dark disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/3 disabled:text-white/18"
          disabled={!canScrollNext}
          onClick={scrollNext}
          type="button"
        >
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
        </button>
      </div>

      <section
        aria-label="Carrossel de produtos da oferta relâmpago"
        className="overflow-hidden"
        ref={emblaRef}
      >
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-0 flex-[0_0_calc(50%-8px)] sm:flex-[0_0_calc(33.333%-10.7px)] xl:flex-[0_0_calc(25%-12px)]"
            >
              <ProductCard product={product} compactOnMobile />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
