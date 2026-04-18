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
    <span className="mx-1 self-start pt-3 font-black text-xl leading-7 tracking-[-0.449219px] text-brand-yellow max-[500px]:self-center max-[500px]:pt-0">
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
      <span className="whitespace-nowrap text-sm leading-5 tracking-[-0.150391px] text-white/60">
        Termina em:
      </span>
      <div className="flex items-start max-[500px]:items-center">
        <CountdownUnit value={h} label="h" />
        <Separator />
        <CountdownUnit value={m} label="m" />
        <Separator />
        <CountdownUnit value={s} label="s" />
      </div>
    </div>
  );
}
