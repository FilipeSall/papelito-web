"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function isOnline(): boolean {
  return navigator.onLine;
}

function serverOnline(): boolean {
  return true;
}

/** Faixa fixa quando o tablet perde a internet. O atendimento continua salvo no aparelho. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, isOnline, serverOnline);

  if (online) return null;

  return (
    <div role="status" className="bg-[#B42318] px-6 py-2 text-center text-sm font-bold text-white">
      Sem conexão. O pedido fica salvo aqui.
    </div>
  );
}
