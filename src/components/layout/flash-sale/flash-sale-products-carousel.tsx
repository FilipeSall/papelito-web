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
    <div className="relative">
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

      {canScrollPrev ? (
        <button
          aria-label="Produtos anteriores da oferta relâmpago"
          className="group absolute -left-5.5 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brand-yellow/30 bg-brand-dark text-brand-yellow transition hover:border-brand-yellow hover:bg-brand-yellow hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/80 md:inline-flex"
          onClick={scrollPrev}
          type="button"
        >
          <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.2} />
        </button>
      ) : null}

      {canScrollNext ? (
        <button
          aria-label="Próximos produtos da oferta relâmpago"
          className="group absolute -right-5.5 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brand-yellow/30 bg-brand-dark text-brand-yellow transition hover:border-brand-yellow hover:bg-brand-yellow hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/80 md:inline-flex"
          onClick={scrollNext}
          type="button"
        >
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}
