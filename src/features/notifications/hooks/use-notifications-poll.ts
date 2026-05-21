"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

import {
  getNotifications,
  getUnreadNotificationCount,
} from "../services/get-notifications";
import { useNotificationsStore } from "../store/use-notifications-store";
import { useAuthSession } from "@/hooks/use-auth-session";

export function useNotificationsPoll() {
  const { isAuthenticated } = useAuthSession();
  const [isVisible, setIsVisible] = useState(() =>
    typeof document === "undefined" ? true : document.visibilityState === "visible",
  );
  const previousCountRef = useRef<number | null>(null);

  const setItems = useNotificationsStore((state) => state.setItems);
  const setUnreadCount = useNotificationsStore((state) => state.setUnreadCount);

  useEffect(() => {
    function handleVisibilityChange() {
      setIsVisible(document.visibilityState === "visible");
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const countKey = isAuthenticated ? "notifications:unread-count" : null;
  const listKey = isAuthenticated ? "notifications:list" : null;

  const count = useSWR(countKey, getUnreadNotificationCount, {
    refreshInterval: isVisible ? 60_000 : 0,
    revalidateOnFocus: true,
  });

  const list = useSWR(listKey, () => getNotifications({ page: 1, perPage: 20 }), {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!count.data) {
      return;
    }

    setUnreadCount(count.data.count);

    if (previousCountRef.current !== null && previousCountRef.current !== count.data.count) {
      void list.mutate();
    }

    previousCountRef.current = count.data.count;
  }, [count.data, list, setUnreadCount]);

  useEffect(() => {
    if (list.data) {
      setItems(list.data.items);
    }
  }, [list.data, setItems]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      previousCountRef.current = null;
    }
  }, [isAuthenticated, setItems, setUnreadCount]);

  return {
    isLoading: count.isLoading || list.isLoading,
    isError: Boolean(count.error || list.error),
    refresh: async () => {
      await Promise.all([count.mutate(), list.mutate()]);
    },
  };
}
