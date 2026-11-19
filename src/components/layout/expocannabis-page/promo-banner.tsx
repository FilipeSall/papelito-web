"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { EventKit, EventLevel } from "@/features/expocannabis/types/context";
import { formatCents } from "@/features/expocannabis/utils/cart";
import { kitDiscountLabel } from "@/features/expocannabis/utils/kit-discount";

import { reducedMotion, useStageScale } from "./motion";

const ART = "/images/expocannabis/figma/banner";

/**
 * Palco com o tamanho exato do frame do Figma, escalado para a largura do container.
 * O teto de 1200 px existe porque a altura acompanha a largura pela proporção do frame:
 * sem ele, numa tela de 2500 px o banner viraria 1997 × 837 e empurraria a prateleira
 * para fora da dobra.
 */
function Stage({ w, h, children, className = "" }: Readonly<{ w: number; h: number; children: ReactNode; className?: string }>) {
  const [ref, scale] = useStageScale<HTMLDivElement>(w);

  return (
    <div ref={ref} className={`relative w-full max-w-[1200px] overflow-hidden ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: w, height: h, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

/* Camadas do frame 21:3550 (Banner · produtos e conquista), posições do Figma. */
const PRODUCTS = [
  { src: ART + "/p1.webp", cx: 595, cy: 56.8, w: 128.1, h: 105.8, rot: 14.05, d: 0.62 },
  { src: ART + "/p2.webp", cx: 686.9, cy: 162.1, w: 144.8, h: 124.9, rot: 11.52, d: 0.74 },
  { src: ART + "/p3.webp", cx: 419, cy: 96, w: 151.7, h: 134.6, rot: 9.57, d: 0.5 },
  { src: ART + "/p4.webp", cx: 542, cy: 150.1, w: 155.2, h: 167.8, rot: -11.17, d: 0.56 },
];

const SPARKS = [
  { src: ART + "/brilho1.svg", cx: 366.4, cy: 160.5, w: 43.9, h: 53.6, d: 0.9 },
  { src: ART + "/brilho2.svg", cx: 665.4, cy: 49.7, w: 34.2, h: 26.2, d: 1.15 },
  { src: ART + "/brilho3.svg", cx: 480.4, cy: 49.3, w: 29.8, h: 28.3, d: 1.35 },
];

/**
 * Desconto progressivo: a chamada entra, o recorte branco corre, a porcentagem carimba
 * (o golpe), os displays sobem em fila e flutuam duas vezes, os brilhos piscam três.
 *
 * A porcentagem é texto, e não a arte "10%" do handoff, porque o teto do desconto é dado
 * do evento: quem publica os níveis no admin muda esse número.
 */
function ProgressiveSlide({ topPct, round = 0, tall = false }: Readonly<{ topPct: number; round?: number; tall?: boolean }>) {
  const h = tall ? 323.5 : 224;

  return (
    <Stage w={772} h={h}>
      <Image src={ART + "/fundo.svg"} alt="" width={772} height={360} unoptimized className="absolute left-0 top-0 h-90 w-[772px] max-w-none" />
      <div key={round} className="absolute inset-x-0 top-0 h-56" style={{ transform: `translateY(${(h - 224) / 2}px)` }}>
        {PRODUCTS.map((product) => (
          <div
            key={product.src}
            className="b-produto absolute flex items-center justify-center"
            style={
              {
                left: product.cx - product.w / 2,
                top: product.cy - product.h / 2,
                width: product.w,
                height: product.h,
                "--d": product.d + "s",
              } as CSSProperties
            }
          >
            <Image
              src={product.src}
              alt=""
              width={Math.round(product.w)}
              height={Math.round(product.h)}
              unoptimized
              className="block max-w-none"
              style={{ width: product.w, height: product.h, transform: `rotate(${product.rot}deg)` }}
            />
          </div>
        ))}
        {SPARKS.map((spark) => (
          <div
            key={spark.src}
            className="b-brilho absolute"
            style={
              {
                left: spark.cx - spark.w / 2,
                top: spark.cy - spark.h / 2,
                width: spark.w,
                height: spark.h,
                "--d": spark.d + "s",
              } as CSSProperties
            }
          >
            <Image
              src={spark.src}
              alt=""
              width={Math.round(spark.w)}
              height={Math.round(spark.h)}
              unoptimized
              className="block size-full max-w-none -rotate-[35.82deg]"
            />
          </div>
        ))}
        <div className="b-recorte absolute flex items-center justify-center" style={{ left: -34, top: 91.87, width: 362.94, height: 106.9 }}>
          <Image
            src={ART + "/recorte-branco.svg"}
            alt=""
            width={359}
            height={88}
            unoptimized
            className="block h-[88.24px] w-[358.82px] max-w-none -rotate-3"
          />
        </div>
        <div className="b-entra-esq absolute flex items-center justify-center" style={{ left: 29.69, top: 20, width: 300.62, height: 83.77 }}>
          <p className="ultra w-[298px] -rotate-[2.27deg] text-[32px] leading-[35px] text-brand-yellow">
            Desconto
            <br />
            progressivo
          </p>
        </div>
        <div className="b-recorte absolute" style={{ left: 14, top: 128, width: 125, height: 36 }}>
          <Image
            src={ART + "/oval.svg"}
            alt=""
            width={126}
            height={37}
            unoptimized
            className="absolute -left-[0.5px] -top-[0.5px] block h-[37px] w-[126px] max-w-none"
          />
        </div>
        <p className="b-recorte ultra absolute text-[18px] leading-6 text-expo-noite" style={{ left: 34, top: 134, width: 88 }}>
          De até
        </p>
        <p className="b-golpe ultra num absolute text-expo-noite" style={{ left: 142, top: 100, fontSize: 64, lineHeight: "72px" }}>
          {topPct + "%"}
        </p>
      </div>
    </Stage>
  );
}

/** Kit Premium: os displays deslizam e o selo dá um carimbo leve. Sem repetição. */
function KitSlide({ kit, round = 0 }: Readonly<{ kit: EventKit; round?: number }>) {
  const hasDiscount = kit.unitCents < kit.fullUnitCents;

  return (
    <Stage w={772} h={323.5} className="bg-brand-yellow">
      <div key={round} className="absolute inset-0 text-expo-ink">
        <div className="absolute left-0 top-0 flex h-full w-[354px] flex-col items-center px-5.5 pt-[63.5px]">
          <p className="ultra h-[97px] text-center text-[128px] leading-[97px] tracking-[0.15px]">Kit</p>
          <p className="ultra mt-3.25 h-10 text-center text-5xl leading-10 tracking-[0.15px]">Premium</p>
          <p className="num mt-3.25 whitespace-pre text-[15px] font-bold">
            {hasDiscount ? (
              <>
                De <span className="line-through">{formatCents(kit.fullUnitCents)}</span>
                {" por  "}
              </>
            ) : null}
            <span className="ultra text-[22px] leading-[20.9px] tracking-[0.11px]">{formatCents(kit.unitCents)}</span>
          </p>
        </div>
        <div className="absolute left-[354px] top-0 h-full w-[418px]">
          <Image
            src={ART + "/kit-papel.svg"}
            alt=""
            width={430}
            height={197}
            unoptimized
            className="absolute -left-0.5 top-[131.13px] block h-[196.5px] w-[430px] max-w-none"
          />
          <div className="k-carimbo absolute flex items-center justify-center" style={{ left: 47, top: -23.37, width: 252.52, height: 185.83 }}>
            <div className="relative h-[161.14px] w-[236.43px] rotate-[6.23deg]">
              <Image
                src={ART + "/kit-selo.svg"}
                alt=""
                width={281}
                height={184}
                unoptimized
                className="absolute -left-[44.1px] -top-[23.2px] block h-[184.36px] w-[280.53px] max-w-none"
              />
            </div>
          </div>
          <div className="k-desliza absolute flex items-center justify-center" style={{ left: -66.96, top: -1.36, width: 529.09, height: 386.09 }}>
            <Image
              src="/images/expocannabis/kit-sedas-premium.webp"
              alt=""
              width={493}
              height={329}
              unoptimized
              className="block h-[328.49px] w-[492.73px] max-w-none -rotate-7 object-contain"
            />
          </div>
        </div>
      </div>
    </Stage>
  );
}

const SWITCH_MS = 6000;

type PromoBannerProps = {
  levels: EventLevel[];
  kit: EventKit;
};

/**
 * Carrossel do topo do Início: alterna sozinho, pausa no toque e no foco, tem botão de
 * pausar e troca no arrasto. Os dois banners vêm do evento, não do código: a porcentagem
 * do desconto progressivo é o maior nível publicado e o preço do kit é o do contexto.
 */
export function PromoBanner({ levels, kit }: Readonly<PromoBannerProps>) {
  const topPct = (levels[levels.length - 1]?.pctBp ?? 0) / 100;
  const discount = kitDiscountLabel(kit.pctOff);
  const slides = [
    { id: "desconto", label: `Desconto progressivo: de até ${topPct}% no pedido` },
    { id: "kit", label: discount ? `Kit Premium: as 4 sedas premium com ${discount}` : "Kit Premium: as 4 sedas premium" },
  ];

  const [index, setIndex] = useState(0);
  const [rounds, setRounds] = useState([0, 0]);
  const [paused, setPaused] = useState(() => reducedMotion());
  const [holding, setHolding] = useState(false);
  const touch = useRef<number | null>(null);

  /* Cada entrada no slide recomeça a animação dele: a troca muda o índice e o efeito
     abaixo incrementa a rodada, que serve de `key` e remonta as camadas. */
  useEffect(() => {
    setRounds((current) => current.map((value, position) => (position === index ? value + 1 : value)));
  }, [index]);

  useEffect(() => {
    if (paused || holding) return undefined;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % 2), SWITCH_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, holding]);

  const go = (next: number) => setIndex((next + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Campanha ExpoDay"
      className="flex flex-none flex-col gap-2"
      onMouseEnter={() => setHolding(true)}
      onMouseLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={() => setHolding(false)}
    >
      <div
        className="relative touch-pan-y overflow-hidden"
        onPointerDown={(event) => {
          touch.current = event.clientX;
          setHolding(true);
        }}
        onPointerUp={(event) => {
          if (touch.current !== null) {
            const dx = event.clientX - touch.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1);
          }
          touch.current = null;
          setHolding(false);
        }}
        onPointerCancel={() => {
          touch.current = null;
          setHolding(false);
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, position) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${position + 1} de ${slides.length}: ${slide.label}`}
              aria-hidden={position !== index}
              className="flex w-full shrink-0 items-start bg-expo-noite"
            >
              {slide.id === "desconto" ? (
                <ProgressiveSlide topPct={topPct} round={rounds[position]} tall />
              ) : (
                <KitSlide kit={kit} round={rounds[position]} />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex" role="group" aria-label="Escolher campanha">
          {slides.map((slide, position) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(position)}
              aria-label={`Mostrar ${slide.label}`}
              aria-current={position === index}
              className="flex h-11 w-13 items-center"
            >
              <span
                className={`block h-1.5 transition-all duration-300 motion-reduce:transition-none ${
                  position === index ? "w-10 bg-brand-yellow" : "w-5.5 bg-white/35"
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="min-h-11 px-2 text-[13px] font-extrabold text-expo-nevoa underline underline-offset-4"
          aria-pressed={paused}
        >
          {paused ? "Tocar" : "Pausar"}
        </button>
      </div>
    </section>
  );
}
