import type {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
} from "../types/notification";

type ApiErrorPayload = {
  message?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function markNotificationRead(id: number): Promise<MarkNotificationReadResponse> {
  const response = await fetch(`/api/notifications/me/${id}/read`, {
    method: "PUT",
    headers: { Accept: "application/json" },
  });

  const payload = await parseJson<MarkNotificationReadResponse & ApiErrorPayload>(response);

  if (!response.ok) {
    throw new Error(payload.message || "Não foi possível marcar a notificação como lida.");
  }

  return payload;
}

export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
  const response = await fetch("/api/notifications/me/read-all", {
    method: "PUT",
    headers: { Accept: "application/json" },
  });

  const payload = await parseJson<MarkAllNotificationsReadResponse & ApiErrorPayload>(response);

  if (!response.ok) {
    throw new Error(payload.message || "Não foi possível marcar notificações como lidas.");
  }

  return payload;
}
