"use client";

import { useSyncExternalStore } from "react";

import { expoEventPhase, type ExpoEventPhase } from "@/features/expocannabis/utils/event-phase";

const TICK_MS = 60_000;

function subscribeToClock(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, TICK_MS);
  return () => window.clearInterval(timer);
}

function currentPhase(): ExpoEventPhase {
  return expoEventPhase(new Date());
}

/**
 * Fase do ExpoCannabis para o atalho do admin, reavaliada a cada minuto.
 * Assim o atalho abre e some na virada da janela sem o administrador recarregar a página.
 */
export function useExpoEventPhase(): ExpoEventPhase {
  return useSyncExternalStore(subscribeToClock, currentPhase, currentPhase);
}
