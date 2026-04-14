"use client";

import Link from "next/link";
import { useCallback, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, SectionHeader } from "@/components/ui";
import { MiniProductCard } from "./mini-product-card";
import type { HomeNewArrivalProduct } from "@/features/catalog";

interface NewArrivalsSectionProps {
  products: HomeNewArrivalProduct[];
}

export function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!emblaApi) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      }
    },
    [emblaApi, scrollNext, scrollPrev],
  );

  return (
    <section className="w-full bg-white py-12">
      <div className="max-w-450 mx-auto px-43.5">
        <div className="w-full max-w-304 mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <SectionHeader emoji="✨" title="Recém Chegados" variant="compact" />

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/novidades"
                className="inline-flex items-center gap-1 text-brand-dark transition-opacity hover:opacity-70"
              >
                <span className="font-black text-sm leading-5 tracking-[-0.150391px] uppercase">
                  Ver todos
                </span>
                <ArrowRightIcon className="size-3.5" />
              </Link>

              <button
                type="button"
                aria-label="Produtos anteriores"
                onClick={scrollPrev}
                className="flex size-8 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-brand-dark transition-colors hover:bg-gray-50"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Próximos produtos"
                onClick={scrollNext}
                className="flex size-8 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-brand-dark transition-colors hover:bg-gray-50"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>

          <div
            aria-label="Carrossel de produtos recém chegados"
            className="-mx-1 overflow-hidden pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            role="region"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            ref={emblaRef}
          >
            <div className="flex gap-4 px-1">
              {products.map((product) => (
                <MiniProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  originalPrice={product.originalPrice}
                  price={product.price}
                  discount={product.discount}
                  image={product.image}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
