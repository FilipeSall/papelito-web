import type {
  NotificationUnreadCountResponse,
  NotificationsListResponse,
} from "../types/notification";

type ApiErrorPayload = {
  message?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function buildQuery(params?: { unreadOnly?: boolean; page?: number; perPage?: number }) {
  const search = new URLSearchParams();

  if (params?.unreadOnly !== undefined) {
    search.set("unread_only", String(params.unreadOnly));
  }

  if (params?.page !== undefined) {
    search.set("page", String(params.page));
  }

  if (params?.perPage !== undefined) {
    search.set("per_page", String(params.perPage));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function getNotifications(
  params?: { unreadOnly?: boolean; page?: number; perPage?: number },
): Promise<NotificationsListResponse> {
  const response = await fetch(`/api/notifications/me${buildQuery(params)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const payload = await parseJson<NotificationsListResponse & ApiErrorPayload>(response);

  if (!response.ok) {
    throw new Error(payload.message || "Não foi possível carregar as notificações.");
  }

  return payload;
}

export async function getUnreadNotificationCount(): Promise<NotificationUnreadCountResponse> {
  const response = await fetch("/api/notifications/me/unread-count", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const payload = await parseJson<NotificationUnreadCountResponse & ApiErrorPayload>(response);

  if (!response.ok) {
    throw new Error(payload.message || "Não foi possível carregar as notificações.");
  }

  return payload;
}
