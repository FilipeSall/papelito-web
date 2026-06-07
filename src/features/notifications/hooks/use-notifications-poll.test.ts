import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildNotification } from "../../../../test/factories/notification";
import { createTestWrapper } from "../../../../test/utils/render-with-providers";
import { useNotificationsStore } from "../store/use-notifications-store";
import { useNotificationsPoll } from "./use-notifications-poll";

let authState = { isApiAuthenticated: true };
const getNotificationsMock = vi.fn();
const getUnreadNotificationCountMock = vi.fn();

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => authState,
}));

vi.mock("../services/get-notifications", () => ({
  getNotifications: (...args: Parameters<typeof getNotificationsMock>) =>
    getNotificationsMock(...args),
  getUnreadNotificationCount: (...args: Parameters<typeof getUnreadNotificationCountMock>) =>
    getUnreadNotificationCountMock(...args),
}));

function setVisibilityState(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useNotificationsPoll", () => {
  beforeEach(() => {
    authState = { isApiAuthenticated: true };
    setVisibilityState("visible");
    getUnreadNotificationCountMock.mockReset();
    getNotificationsMock.mockReset();
    getUnreadNotificationCountMock.mockResolvedValue({ count: 1 });
    getNotificationsMock.mockResolvedValue({
      items: [buildNotification()],
      total: 1,
      page: 1,
      perPage: 20,
    });
  });

  afterEach(() => {
    setVisibilityState("visible");
  });

  it("loads unread count and items for authenticated users", async () => {
    const { result } = renderHook(() => useNotificationsPoll(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(useNotificationsStore.getState().unreadCount).toBe(1);
      expect(useNotificationsStore.getState().items).toHaveLength(1);
    });
  });

  it("does not keep polling when the document is hidden", async () => {
    vi.useFakeTimers();

    setVisibilityState("hidden");

    renderHook(() => useNotificationsPoll(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useNotificationsStore.getState().unreadCount).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(getUnreadNotificationCountMock).toHaveBeenCalledTimes(1);
  });

  it("revalidates the list when the unread count changes", async () => {
    vi.useFakeTimers();
    getUnreadNotificationCountMock
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 });
    getNotificationsMock
      .mockResolvedValueOnce({
        items: [buildNotification({ id: 1 })],
        total: 1,
        page: 1,
        perPage: 20,
      })
      .mockResolvedValueOnce({
        items: [buildNotification({ id: 2 })],
        total: 1,
        page: 1,
        perPage: 20,
      });

    renderHook(() => useNotificationsPoll(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useNotificationsStore.getState().unreadCount).toBe(1);
    expect(getNotificationsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useNotificationsStore.getState().unreadCount).toBe(2);
    expect(getNotificationsMock).toHaveBeenCalledTimes(2);
  });

  it("clears notifications when the user logs out", async () => {
    const { rerender } = renderHook(() => useNotificationsPoll(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(useNotificationsStore.getState().items).toHaveLength(1);
    });

    authState = { isApiAuthenticated: false };
    rerender();

    await waitFor(() => {
      expect(useNotificationsStore.getState().items).toEqual([]);
      expect(useNotificationsStore.getState().unreadCount).toBe(0);
    });
  });
});
