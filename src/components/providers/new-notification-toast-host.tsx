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

  useEffect(() => {
    if (!isApiAuthenticated || !userId) {
      return;
    }

    const newestUnreadId = pickNewestUnreadId(items);

    if (newestUnreadId === null) {
      return;
    }

    const lastSeenId = getLastSeenNotificationId(userId);

    // Grava o baseline antes de decidir exibir: no primeiro acesso apenas registramos o maior id
    // conhecido, e a segunda passagem do efeito (Strict Mode) já lê o valor atualizado e sai.
    setLastSeenNotificationId(userId, newestUnreadId);

    if (lastSeenId === null || newestUnreadId <= lastSeenId) {
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
