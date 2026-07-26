"use client";

import { useEffect, useRef, useState } from "react";

import { NewNotificationToast } from "./new-notification-toast";
import {
  getLastSeenNotificationId,
  pickNewestUnreadId,
  setLastSeenNotificationId,
} from "@/features/notifications/utils/notification-seen-store";
import { useNotificationsStore } from "@/features/notifications";
import { useAuthSession } from "@/hooks/use-auth-session";

const TOAST_DURATION_MS = 6000;

export function NewNotificationToastHost() {
  const { isApiAuthenticated, session } = useAuthSession();
  const userId = session?.user?.id ?? "";
  const items = useNotificationsStore((state) => state.items);
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterAnimationFrameRef = useRef<number | null>(null);
  const notifiedIdRef = useRef<number | null>(null);
  const seededUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isApiAuthenticated || !userId) {
      return;
    }

    // Baseline ausente tem dois significados: notificações que já existiam quando a sessão montou
    // (semear e calar) e a primeira notificação da conta chegando ao vivo (avisar). Só o primeiro
    // suprime o toast. O seed é marcado por usuário e já na primeira passagem com sessão pronta,
    // mesmo com lista vazia — senão a estreia da conta seria confundida com pré-existente, e com
    // localStorage bloqueado (Safari privado) o baseline seria sempre nulo e o toast nunca sairia.
    const isFirstPassForUser = seededUserRef.current !== userId;

    seededUserRef.current = userId;

    const newestUnreadId = pickNewestUnreadId(items);

    if (newestUnreadId === null) {
      return;
    }

    const lastSeenId = getLastSeenNotificationId(userId);
    const isSeedingPass = lastSeenId === null && isFirstPassForUser;

    setLastSeenNotificationId(userId, newestUnreadId);

    if (isSeedingPass) {
      return;
    }

    if (lastSeenId !== null && newestUnreadId <= lastSeenId) {
      return;
    }

    if (notifiedIdRef.current !== null && newestUnreadId <= notifiedIdRef.current) {
      return;
    }

    notifiedIdRef.current = newestUnreadId;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    enterAnimationFrameRef.current = requestAnimationFrame(() => {
      setVisible(true);
    });

    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, TOAST_DURATION_MS);
  }, [isApiAuthenticated, items, userId]);

  useEffect(() => {
    if (isApiAuthenticated) {
      return;
    }

    notifiedIdRef.current = null;
    seededUserRef.current = null;
    enterAnimationFrameRef.current = requestAnimationFrame(() => {
      setVisible(false);
    });
  }, [isApiAuthenticated]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (enterAnimationFrameRef.current) {
        cancelAnimationFrame(enterAnimationFrameRef.current);
      }
    };
  }, []);

  if (!isApiAuthenticated) {
    return null;
  }

  return <NewNotificationToast visible={visible} />;
}
