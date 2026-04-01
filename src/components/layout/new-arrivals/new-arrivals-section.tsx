"use client";

import { useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CompactSectionHeader } from "./compact-section-header";
import { MiniProductCard } from "./mini-product-card";
import type { HomeNewArrivalProduct } from "@/features/catalog";

interface NewArrivalsSectionProps {
  products: HomeNewArrivalProduct[];
}

/**
 * Ícone de seta para a esquerda (anterior).
 */
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

/**
 * Ícone de seta para a direita (próximo).
 */
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

/**
 * Seção "Recém Chegados" com carousel horizontal de produtos.
 *
 * Organismo que exibe:
 * - Cabeçalho compacto com emoji ✨, título "RECÉM CHEGADOS" e link "Ver todos"
 * - Carousel horizontal de mini cards usando Embla Carousel
 * - Botões de navegação (setas) para anterior/próximo
 *
 * Os cards são compactos (176px de largura) e exibem apenas informações
 * essenciais: imagem, desconto, nome, preços e botão "Adicionar".
 *
 * @example
 * ```tsx
 * <NewArrivalsSection />
 * ```
 */
export function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    breakpoints: {
      "(max-width: 640px)": {
        slidesToScroll: 1.2,
      },
    },
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Cleanup Embla API on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (emblaApi) {
        emblaApi.destroy();
      }
    };
  }, [emblaApi]);

  return (
    <section className="w-full bg-white py-12 select-none">
      <div className="max-w-450 mx-auto px-43.5">
        <div className="w-full max-w-304 mx-auto flex flex-col gap-6">
          {/* Header with navigation arrows */}
          <div className="flex items-center justify-between">
            <CompactSectionHeader
              emoji="✨"
              title="Recém Chegados"
              href="/novidades"
            />

            {/* Navigation arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={scrollPrev}
                aria-label="Produtos anteriores"
                className="flex items-center justify-center size-10 rounded-full border border-[#E5E7EB] bg-white hover:bg-gray-50 transition-colors"
              >
                <ChevronLeftIcon className="size-5 text-brand-dark" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                aria-label="Próximos produtos"
                className="flex items-center justify-center size-10 rounded-full border border-[#E5E7EB] bg-white hover:bg-gray-50 transition-colors"
              >
                <ChevronRightIcon className="size-5 text-brand-dark" />
              </button>
            </div>
          </div>

          {/* Embla Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {products.map((product) => (
                <MiniProductCard
                  key={product.id}
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
