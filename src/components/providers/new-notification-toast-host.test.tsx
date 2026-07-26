import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildNotification } from "../../../test/factories/notification";
import { useNotificationsStore } from "@/features/notifications";
import { NewNotificationToastHost } from "./new-notification-toast-host";

let authState = {
  isApiAuthenticated: true,
  session: { user: { id: "42" } },
};

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => authState,
}));

const TOAST_TEXT = "Você recebeu uma nova notificação.";

function setItems(items: ReturnType<typeof buildNotification>[]) {
  act(() => {
    useNotificationsStore.setState({ items });
  });
}

// O toast fica sempre montado e a visibilidade é só transição de opacidade/translate, então
// `toBeVisible()` do jsdom não serve — o sinal real de estado é a classe de opacidade.
function isToastShown() {
  const toast = screen.queryByRole("status");
  return toast !== null && toast.className.includes("opacity-100");
}

// A exibição é agendada num requestAnimationFrame, então asserir ausência de forma síncrona
// passaria mesmo com o toast prestes a aparecer. Sempre drene os frames pendentes antes.
async function flushAnimationFrames() {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await Promise.resolve();
  });
}

describe("NewNotificationToastHost", () => {
  beforeEach(() => {
    authState = {
      isApiAuthenticated: true,
      session: { user: { id: "42" } },
    };
    window.localStorage.clear();
    useNotificationsStore.setState({ unreadCount: 0, items: [] });
  });

  it("does not toast for pre-existing unread notifications on first load", async () => {
    useNotificationsStore.setState({
      items: [buildNotification({ id: 7 }), buildNotification({ id: 8 })],
    });

    render(<NewNotificationToastHost />);

    await flushAnimationFrames();
    expect(isToastShown()).toBe(false);
  });

  it("shows a single toast when a genuinely new notification arrives", async () => {
    useNotificationsStore.setState({ items: [buildNotification({ id: 7 })] });

    render(<NewNotificationToastHost />);
    await flushAnimationFrames();
    expect(isToastShown()).toBe(false);

    setItems([buildNotification({ id: 8 }), buildNotification({ id: 7 })]);

    await waitFor(() => {
      expect(isToastShown()).toBe(true);
    });

    expect(screen.getAllByText(TOAST_TEXT)).toHaveLength(1);
  });

  it("does not repeat the toast when polling returns the same notifications", async () => {
    useNotificationsStore.setState({ items: [buildNotification({ id: 7 })] });

    render(<NewNotificationToastHost />);

    setItems([buildNotification({ id: 8 })]);
    await waitFor(() => {
      expect(isToastShown()).toBe(true);
    });

    setItems([buildNotification({ id: 8 })]);
    setItems([buildNotification({ id: 8 })]);
    await flushAnimationFrames();

    expect(screen.getAllByText(TOAST_TEXT)).toHaveLength(1);
    expect(window.localStorage.getItem("papelito:notifications:last-seen-id:42")).toBe("8");
  });

  it("shows one toast when several notifications arrive at once", async () => {
    useNotificationsStore.setState({ items: [buildNotification({ id: 7 })] });

    render(<NewNotificationToastHost />);

    setItems([
      buildNotification({ id: 10 }),
      buildNotification({ id: 9 }),
      buildNotification({ id: 8 }),
    ]);

    await waitFor(() => {
      expect(isToastShown()).toBe(true);
    });

    expect(screen.getAllByText(TOAST_TEXT)).toHaveLength(1);
    expect(window.localStorage.getItem("papelito:notifications:last-seen-id:42")).toBe("10");
  });

  it("does not toast again on a fresh mount sharing the stored baseline", async () => {
    useNotificationsStore.setState({ items: [buildNotification({ id: 7 })] });

    const first = render(<NewNotificationToastHost />);
    setItems([buildNotification({ id: 8 })]);

    await waitFor(() => {
      expect(isToastShown()).toBe(true);
    });

    first.unmount();

    render(<NewNotificationToastHost />);

    await flushAnimationFrames();
    expect(isToastShown()).toBe(false);
  });

  it("does not toast when the count drops because items were read", async () => {
    useNotificationsStore.setState({ items: [buildNotification({ id: 7 })] });

    render(<NewNotificationToastHost />);

    setItems([buildNotification({ id: 7, readAt: "2026-06-07T10:05:00.000Z" })]);

    await flushAnimationFrames();
    expect(isToastShown()).toBe(false);
  });

  it("does not toast for a newer notification that already arrived read", async () => {
    useNotificationsStore.setState({ items: [buildNotification({ id: 7 })] });

    render(<NewNotificationToastHost />);

    setItems([
      buildNotification({ id: 12, readAt: "2026-06-07T10:05:00.000Z" }),
      buildNotification({ id: 7 }),
    ]);

    await flushAnimationFrames();
    expect(isToastShown()).toBe(false);
  });

  it("renders nothing for unauthenticated users", async () => {
    authState = {
      isApiAuthenticated: false,
      session: { user: { id: "42" } },
    };

    render(<NewNotificationToastHost />);

    expect(screen.queryByText(TOAST_TEXT)).not.toBeInTheDocument();
  });
});
