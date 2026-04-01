"use client";

import { useEffect, useState } from "react";
import { CountdownUnit } from "./countdown-unit";
import { FLASH_SALE_INITIAL_SECONDS } from "./constants";

function parseTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s };
}

function Separator() {
  return (
    <span className="font-black text-xl leading-7 tracking-[-0.449219px] text-brand-yellow self-start mt-[14px] mx-1">
      :
    </span>
  );
}

/**
 * Contador regressivo molecular da oferta.
 *
 * Componente cliente que parte de `FLASH_SALE_INITIAL_SECONDS` e decrementa
 * um segundo a cada intervalo. Cada unidade exibe animação de entrada
 * ao trocar de valor (via `key` no `CountdownUnit`).
 */
export function CountdownTimer() {
  const [remaining, setRemaining] = useState(FLASH_SALE_INITIAL_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { h, m, s } = parseTime(remaining);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm leading-5 tracking-[-0.150391px] text-white/60 whitespace-nowrap">
        Termina em:
      </span>
      <div className="flex items-start">
        <CountdownUnit value={h} />
        <Separator />
        <CountdownUnit value={m} />
        <Separator />
        <CountdownUnit value={s} />
      </div>
    </div>
  );
}
