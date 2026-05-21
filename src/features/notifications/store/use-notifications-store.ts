"use client";

import { create } from "zustand";

import type { NotificationItem } from "../types/notification";

type NotificationsState = {
  unreadCount: number;
  items: NotificationItem[];
  setItems: (items: NotificationItem[]) => void;
  setUnreadCount: (count: number) => void;
  markRead: (id: number, readAt?: string | null) => void;
  markAllRead: () => void;
};

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  unreadCount: 0,
  items: [],
  setItems: (items) => set({ items }),
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  markRead: (id, readAt) =>
    set((state) => {
      const existing = state.items.find((item) => item.id === id);
      const wasUnread = Boolean(existing && !existing.readAt);

      return {
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        items: state.items.map((item) =>
          item.id === id
            ? {
                ...item,
                readAt: readAt ?? item.readAt ?? new Date().toISOString(),
              }
            : item,
        ),
      };
    }),
  markAllRead: () =>
    set((state) => ({
      unreadCount: 0,
      items: state.items.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    })),
}));
