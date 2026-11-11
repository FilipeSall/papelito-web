"use client";

import { useCallback, useEffect, useReducer, useState, type Dispatch } from "react";

import type { EventContext } from "../types/context";
import {
  attendanceReducer,
  initialAttendance,
  type AttendanceAction,
  type AttendanceState,
} from "./attendance-reducer";

/** Chave do atendimento no `localStorage` do tablet. */
export const ATTENDANCE_STORAGE_KEY = "papelito-expocannabis-atendimento-v1";

/** Tempo sem toque até o aviso "Ainda tá aí?". */
export const IDLE_WARNING_MS = 3 * 60 * 1000;

/** Tempo do aviso até apagar o atendimento. */
export const IDLE_RESET_MS = 20 * 1000;

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

const UNSETTLED_STATES = new Set(["sending", "at_terminal", "check_terminal"]);

function readStored(): AttendanceState {
  try {
    const raw = window.localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const screen = (parsed as { screen?: unknown } | null)?.screen;
    return typeof screen === "number" ? { ...initialAttendance(), ...(parsed as Partial<AttendanceState>) } : initialAttendance();
  } catch {
    return initialAttendance();
  }
}

function writeStored(state: AttendanceState): void {
  try {
    window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

function clearStored(): void {
  try {
    window.localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
  } catch {
    return;
  }
}

function isPaused(state: AttendanceState): boolean {
  const unsettled = state.order !== null && UNSETTLED_STATES.has(state.order.state);
  return unsettled || (state.screen === 1 && state.buyer === null);
}

/** Atendimento do tablet com persistência local e o relógio de inatividade. */
export type Attendance = {
  state: AttendanceState;
  dispatch: Dispatch<AttendanceAction>;
  reset: () => void;
  idleWarning: boolean;
  keepAlive: () => void;
};

/**
 * Estado do atendimento no tablet compartilhado.
 *
 * Persiste a cada mudança e apaga tudo em "Novo pedido", CNPJ novo ou 3 min sem toque (mais 20 s
 * de aviso). Com cobrança sem desfecho confirmado (mandando, na máquina ou a conferir) o relógio
 * fica parado, para o tablet não perder o pedido nem a chave de idempotência.
 */
export function useAttendance(_context: EventContext): Attendance {
  const [state, dispatch] = useReducer(attendanceReducer, undefined, readStored);
  const [idleWarning, setIdleWarning] = useState(false);
  const [activity, setActivity] = useState(0);
  const paused = isPaused(state);

  const reset = useCallback(() => {
    clearStored();
    setIdleWarning(false);
    dispatch({ type: "reset" });
  }, []);

  const keepAlive = useCallback(() => {
    setIdleWarning(false);
    setActivity((value) => value + 1);
  }, []);

  useEffect(() => {
    writeStored(state);
  }, [state]);

  useEffect(() => {
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, keepAlive);
    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, keepAlive);
    };
  }, [keepAlive]);

  useEffect(() => {
    if (paused) return undefined;
    const warn = window.setTimeout(() => setIdleWarning(true), IDLE_WARNING_MS);
    const end = window.setTimeout(reset, IDLE_WARNING_MS + IDLE_RESET_MS);
    return () => {
      window.clearTimeout(warn);
      window.clearTimeout(end);
    };
  }, [paused, activity, reset]);

  return { state, dispatch, reset, idleWarning: idleWarning && !paused, keepAlive };
}
