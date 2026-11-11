"use client";

import { useCallback, useState } from "react";

import type { EventTerminal } from "../types/context";

/** Chave da maquininha escolhida no `localStorage` do aparelho. Sobrevive a "Novo pedido". */
export const TERMINAL_STORAGE_KEY = "papelito-expocannabis-maquininha-v1";

function readChoice(terminals: readonly EventTerminal[]): string {
  const fallback = terminals[0]?.id ?? "";
  try {
    const stored = window.localStorage.getItem(TERMINAL_STORAGE_KEY);
    return terminals.some((terminal) => terminal.id === stored) ? (stored as string) : fallback;
  } catch {
    return fallback;
  }
}

function writeChoice(terminalId: string): void {
  try {
    window.localStorage.setItem(TERMINAL_STORAGE_KEY, terminalId);
  } catch {
    return;
  }
}

/**
 * Maquininha em que este aparelho cobra: a padrão do evento (a primeira da lista) até o operador
 * escolher outra, e daí em diante a escolhida, lembrada no aparelho entre atendimentos.
 *
 * Escolha que deixou de ser do evento volta para a padrão. Devolve `[id, escolher]`.
 */
export function useTerminalChoice(terminals: readonly EventTerminal[]): [string, (terminalId: string) => void] {
  const [terminalId, setTerminalId] = useState(() => readChoice(terminals));

  const choose = useCallback((next: string) => {
    writeChoice(next);
    setTerminalId(next);
  }, []);

  return [terminalId, choose];
}
