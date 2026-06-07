import { describe, expect, it } from "vitest";

import { buildNotification } from "../../../../test/factories/notification";
import { useNotificationsStore } from "./use-notifications-store";

describe("useNotificationsStore", () => {
  it("decrements unread count only when the notification was unread", () => {
    useNotificationsStore.setState({
      unreadCount: 2,
      items: [
        buildNotification({ id: 1, readAt: null }),
        buildNotification({ id: 2, readAt: "2026-06-07T10:00:00.000Z" }),
      ],
    });

    useNotificationsStore.getState().markRead(1);
    useNotificationsStore.getState().markRead(2);

    expect(useNotificationsStore.getState().unreadCount).toBe(1);
  });

  it("marks all notifications as read and zeroes the unread count", () => {
    useNotificationsStore.setState({
      unreadCount: 2,
      items: [
        buildNotification({ id: 1, readAt: null }),
        buildNotification({ id: 2, readAt: null }),
      ],
    });

    useNotificationsStore.getState().markAllRead();

    expect(useNotificationsStore.getState().unreadCount).toBe(0);
    expect(useNotificationsStore.getState().items.every((item) => item.readAt)).toBe(true);
  });
});
