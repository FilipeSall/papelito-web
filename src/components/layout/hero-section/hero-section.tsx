"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
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

const NAV_BTN: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "1px solid rgba(255, 229, 0, 0.27)",
  padding: "0 9px",
  background: "rgba(255, 229, 0, 0.13)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 10,
};

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

  return (
    <>
      <section
        className={
          isMobileOnly
            ? "relative h-[calc(100vw*2)] min-h-160 w-full flex-none overflow-hidden"
            : "relative h-135 w-full flex-none overflow-hidden"
        }
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === activeIndex ? 1 : 0,
              transition: "opacity 0.6s ease-in-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={isMobileOnly ? slide.mobileSrc : slide.desktopSrc}
                alt={slide.alt}
                fill
                priority={i === 0}
                className={isMobileOnly ? "object-contain object-top" : "object-cover"}
                sizes="100vw"
              />
            </div>
          </div>
        ))}

        {!isMobileOnly && isCarousel ? (
          <>
            {/* Botão anterior */}
            <button
              onClick={prev}
              style={{ ...NAV_BTN, left: 16 }}
              aria-label="Slide anterior"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            {/* Botão próximo */}
            <button
              onClick={next}
              style={{ ...NAV_BTN, right: 16 }}
              aria-label="Próximo slide"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </>
        ) : null}

        {/* Indicadores */}
        {isCarousel ? (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 8,
              zIndex: 10,
            }}
          >
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => {
                  setCurrent(i);
                  resetTimer();
                }}
                aria-label={`Ir para slide ${i + 1}`}
                style={{
                  width: i === activeIndex ? 28 : 8,
                  height: 8,
                  borderRadius: 9999,
                  background: i === activeIndex ? "#FFE500" : "#FFE50055",
                  border: "none",
                  cursor: "pointer",
                  transition: "width 0.3s ease, background 0.3s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        ) : null}
      </section>
      <div className="h-0.5 w-full bg-[#FFE500] max-[500px]:h-1" />
    </>
  );
}
