import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildNotification } from "../../../../test/factories/notification";
import { useNotificationsStore } from "@/features/notifications";
import { NotificationBell } from "./notification-bell";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const markNotificationReadMock = vi.fn();
const markAllNotificationsReadMock = vi.fn();

let authState = { isApiAuthenticated: true };
let currentPathname = "/";
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => currentPathname,
  useSearchParams: () => currentSearchParams,
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => authState,
}));

vi.mock("@/features/notifications", async () => {
  const actual = await vi.importActual<typeof import("@/features/notifications")>(
    "@/features/notifications",
  );

  return {
    ...actual,
    useNotificationsPoll: () => ({
      isLoading: false,
      isError: false,
      refresh: refreshMock,
    }),
    markNotificationRead: (...args: Parameters<typeof markNotificationReadMock>) =>
      markNotificationReadMock(...args),
    markAllNotificationsRead: (...args: Parameters<typeof markAllNotificationsReadMock>) =>
      markAllNotificationsReadMock(...args),
  };
});

describe("NotificationBell", () => {
  beforeEach(() => {
    authState = { isApiAuthenticated: true };
    currentPathname = "/";
    currentSearchParams = new URLSearchParams();
    pushMock.mockReset();
    refreshMock.mockReset();
    markNotificationReadMock.mockReset();
    markAllNotificationsReadMock.mockResolvedValue({
      success: true,
      unreadCount: 0,
    });
    useNotificationsStore.setState({
      unreadCount: 12,
      items: [buildNotification()],
    });
  });

  it("does not render for unauthenticated users", () => {
    authState = { isApiAuthenticated: false };

    render(<NotificationBell />);

    expect(screen.queryByRole("button", { name: /notifica/i })).not.toBeInTheDocument();
  });

  it("shows capped unread badge and toggles the dropdown", async () => {
    const user = userEvent.setup();

    render(<NotificationBell />);

    const button = screen.getByRole("button", { name: /12 não lidas/i });
    expect(screen.getByText("9+")).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("stacks the dropdown above the admin select lists, which render at z-90", async () => {
    const user = userEvent.setup();

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /12 não lidas/i }));

    const zIndex = Number(
      /z-\[(\d+)\]/.exec(screen.getByRole("dialog").className)?.[1] ?? "0",
    );
    expect(zIndex).toBeGreaterThan(90);
  });

  it("marks all notifications as read from the dropdown", async () => {
    const user = userEvent.setup();

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /12 não lidas/i }));
    await user.click(screen.getByRole("button", { name: /marcar todas/i }));

    await waitFor(() => {
      expect(markAllNotificationsReadMock).toHaveBeenCalledTimes(1);
      expect(useNotificationsStore.getState().unreadCount).toBe(0);
    });

    expect(screen.queryByText("9+")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notificações" })).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows a blocking loader while redirecting from a notification", async () => {
    const user = userEvent.setup();
    markNotificationReadMock.mockResolvedValue({
      unreadCount: 11,
      item: buildNotification({ readAt: "2026-06-11T20:00:00.000Z" }),
    });

    const { rerender } = render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /12 não lidas/i }));
    await user.click(screen.getByRole("button", { name: /favorito em promoção/i }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getAllByText("Abrindo notificação...")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: /11 não lidas/i })).toBeDisabled();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/produtos/99");
    });

    currentPathname = "/produtos/99";
    rerender(<NotificationBell />);

    await waitFor(() => {
      expect(screen.queryByText("Abrindo notificação...")).not.toBeInTheDocument();
    });
  });
});
