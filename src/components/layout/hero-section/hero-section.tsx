"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

const slides = [
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

const NAV_BTN: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 40,
  height: 40,
  opacity: 1,
  borderRadius: "50%",
  border: "1px solid #FFE50044",
  borderTop: "1px solid #FFE50044",
  padding: "0 9px",
  background: "#FFE50022",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 10,
  backdropFilter: "blur(4px)",
};

export function HeroSection() {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + slides.length) % slides.length),
    []
  );

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % slides.length),
    []
  );

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <>
      <section className="relative flex-1 overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === current ? 1 : 0,
              transition: "opacity 0.6s ease-in-out",
            }}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}

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

        {/* Indicadores */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
            zIndex: 10,
          }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir para slide ${i + 1}`}
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                borderRadius: 9999,
                background: i === current ? "#FFE500" : "#FFE50055",
                border: "none",
                cursor: "pointer",
                transition: "width 0.3s ease, background 0.3s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
      </section>
      <div style={{ width: "100%", height: "0.25rem", background: "#FFE500" }} />
    </>
  );
}
