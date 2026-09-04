"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_HIDE_DELAY_MS = 2600;
const TOAST_REMOVE_DELAY_MS = 2900;

export type AdminToastState = {
  description: string;
  title: string;
} | null;

/**
 * Ciclo de vida do aviso de sucesso do painel.
 *
 * Os quatro painéis desta seção salvam de forma independente e todos precisam do mesmo par
 * entrada/saída com dois temporizadores e um quadro de animação. A lógica estava escrita dentro do
 * gerenciador de cupons; extrair aqui evita quatro cópias que envelheceriam separado.
 */
export function useAdminToast() {
  const [toast, setToast] = useState<AdminToastState>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterFrameRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (removeTimerRef.current) {
      clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }

    if (enterFrameRef.current) {
      cancelAnimationFrame(enterFrameRef.current);
      enterFrameRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const showToast = useCallback(
    (next: NonNullable<AdminToastState>) => {
      clearTimers();
      setIsVisible(false);
      setToast(next);

      enterFrameRef.current = requestAnimationFrame(() => {
        setIsVisible(true);
      });

      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, TOAST_HIDE_DELAY_MS);

      removeTimerRef.current = setTimeout(() => {
        setToast(null);
      }, TOAST_REMOVE_DELAY_MS);
    },
    [clearTimers],
  );

  const dismissToast = useCallback(() => {
    clearTimers();
    setIsVisible(false);

    removeTimerRef.current = setTimeout(() => {
      setToast(null);
    }, TOAST_REMOVE_DELAY_MS - TOAST_HIDE_DELAY_MS);
  }, [clearTimers]);

  return { dismissToast, isVisible, showToast, toast };
}
