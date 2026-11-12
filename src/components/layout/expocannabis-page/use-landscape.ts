import { useSyncExternalStore } from "react";

const LANDSCAPE = "(min-width: 1024px)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(LANDSCAPE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function snapshot(): boolean {
  return window.matchMedia(LANDSCAPE).matches;
}

function serverSnapshot(): boolean {
  return false;
}

/** Diz se a tela está em paisagem (≥ 1024 px): o pedido vira painel fixo em vez de folha. */
export function useLandscape(): boolean {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
