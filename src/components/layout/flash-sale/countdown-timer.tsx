"use client";

import { useEffect, useState } from "react";
import { CountdownUnit } from "./countdown-unit";

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
 * Componente cliente que calcula o restante a partir do encerramento da
 * campanha. Cada unidade exibe animação de entrada ao trocar de valor.
 */
export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const remaining = getRemainingSeconds(endsAt, now);

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

function getRemainingSeconds(endsAt: string, now = Date.now()) {
  if (!endsAt) {
    return 0;
  }

  const endsAtTimestamp = Date.parse(endsAt);

  if (Number.isNaN(endsAtTimestamp)) {
    return 0;
  }

  return Math.max(0, Math.floor((endsAtTimestamp - now) / 1000));
}
