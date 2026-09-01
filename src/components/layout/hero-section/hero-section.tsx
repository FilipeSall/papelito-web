"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { BrandArrowIcon } from "@/components/ui/icons";
import { AUTO_INTERVAL } from "@/constants/auto-interval";
import type { HeroBanner } from "@/types/home-assets";

const fallbackDesktopSlides = [
  {
    src: "/images/hero-section/Banners-Marketplace-B2B-01.png",
    alt: "Banner Marketplace B2B 01",
  },
  {
    src: "/images/hero-section/Banners-Marketplace-B2B-02.png",
    alt: "Banner Marketplace B2B 02",
  },
  {
    src: "/images/hero-section/Banners-Marketplace-B2B-03.png",
    alt: "Banner Marketplace B2B 03",
  },
  {
    src: "/images/hero-section/Banners-Marketplace-B2B-04.png",
    alt: "Banner Marketplace B2B 04",
  },
];

const fallbackMobileSlides = [
  {
    src: "/images/hero-section/Banners-Marketplace-B2B-07_-Mobile.png",
    alt: "Banner Marketplace B2B 07 Mobile",
  },
  {
    src: "/images/hero-section/Banners-Marketplace-B2B-08--Mobile.png",
    alt: "Banner Marketplace B2B 08 Mobile",
  },
  {
    src: "/images/hero-section/Banners-Marketplace-B2B-09--Mobile.png",
    alt: "Banner Marketplace B2B 09 Mobile",
  },
  {
    src: "/images/hero-section/Banners-Marketplace-B2B-10---Mobile.png",
    alt: "Banner Marketplace B2B 10 Mobile",
  },
];

const MOBILE_ONLY_MAX_WIDTH = 500;

type HeroSlide = {
  alt: string;
  desktopSrc: string;
  id: string;
  mobileSrc: string;
};

const NAV_BTN_CLASS =
  "absolute top-1/2 z-10 -mt-5.5 flex size-11 items-center justify-center border-2 border-brand-dark bg-brand-yellow text-brand-dark shadow-[3px_3px_0_#231f20] transition-[background-color,box-shadow,translate] duration-100 ease-out hover:bg-white active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#231f20]";

const NAV_ICON_CLASS = "size-4 shrink-0 transition-transform duration-300 ease-in-out"

function buildSlides(banners: HeroBanner[]): HeroSlide[] {
  if (banners.length === 0) {
    return fallbackDesktopSlides.map((slide, index) => ({
      alt: slide.alt,
      desktopSrc: slide.src,
      id: `fallback-${index + 1}`,
      mobileSrc: fallbackMobileSlides[index]?.src ?? slide.src,
    }));
  }

  return banners.map((banner, index) => ({
    alt: banner.alt || `Hero banner ${index + 1}`,
    desktopSrc: banner.desktopImageUrl,
    id: banner.id,
    mobileSrc: banner.mobileImageUrl,
  }));
}

export function HeroSection({ banners = [] }: Readonly<{ banners?: HeroBanner[] }>) {
  const [current, setCurrent] = useState(0);
  const [isMobileOnly, setIsMobileOnly] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const slides = buildSlides(banners);
  const activeIndex = current % slides.length;
  const isCarousel = slides.length > 1;

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (!isCarousel) {
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, AUTO_INTERVAL);
  }, [isCarousel, slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
    resetTimer();
  }, [resetTimer, slides.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
    resetTimer();
  }, [resetTimer, slides.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_ONLY_MAX_WIDTH}px)`);

    const handleViewportChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileOnly(event.matches);
    };

    handleViewportChange(mediaQuery);
    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    resetTimer();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [resetTimer, slides.length]);

  // A faixa de condições continua visualmente por trás do eco amarelo do rasgo.
  return (
    <section className="relative z-10 w-full bg-brand-dark">
      {/* Folha de ponta a ponta: o enquadramento vem do corte diagonal na base,
          não de margem lateral — e o eco amarelo aparece embaixo do rasgo. */}
      <div className="animate-sheet-settle">
        <div className="aisle-cut w-full bg-brand-dark p-0 md:p-3">
          <div
            className={
              isMobileOnly
                ? "relative h-[calc(100vw*2)] w-full overflow-hidden"
                : "relative h-92 w-full overflow-hidden md:h-120 xl:h-132"
            }
          >
            {slides.map((slide, i) => (
              <div
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                key={slide.id}
                style={{ opacity: i === activeIndex ? 1 : 0 }}
              >
                <Image
                  alt={slide.alt}
                  className="object-cover object-center"
                  fill
                  loading={i === activeIndex ? "eager" : "lazy"}
                  priority={i === activeIndex}
                  sizes="100vw"
                  src={isMobileOnly ? slide.mobileSrc : slide.desktopSrc}
                />
              </div>
            ))}

            {isCarousel ? (
              <>
                <button
                  aria-label="Slide anterior"
                  className={`group/nav ${NAV_BTN_CLASS} left-4 md:left-8`}
                  onClick={prev}
                  type="button"
                >
                  <BrandArrowIcon
                    className={`${NAV_ICON_CLASS} -rotate-180 group-hover/nav:-translate-x-1.5 group-hover/nav:rotate-[-195deg]`}
                  />
                </button>

                <button
                  aria-label="Próximo slide"
                  className={`group/nav ${NAV_BTN_CLASS} right-4 md:right-8`}
                  onClick={next}
                  type="button"
                >
                  <BrandArrowIcon
                    className={`${NAV_ICON_CLASS} group-hover/nav:translate-x-1.5 group-hover/nav:rotate-[15deg]`}
                  />
                </button>

                <div className="absolute right-4 top-4 z-10 flex items-center gap-2.5 bg-brand-dark/85 px-3 py-2 md:right-8 md:top-6">
                  {slides.map((slide, i) => (
                    <button
                      aria-current={i === activeIndex ? "true" : undefined}
                      aria-label={`Ir para o banner ${i + 1}`}
                      className="flex size-5 items-center justify-center"
                      key={slide.id}
                      onClick={() => {
                        setCurrent(i);
                        resetTimer();
                      }}
                      type="button"
                    >
                      <span
                        aria-hidden
                        className={`inline-block rotate-45 bg-brand-yellow transition-all duration-300 ${
                          i === activeIndex ? "size-3" : "size-1.5 opacity-45"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
