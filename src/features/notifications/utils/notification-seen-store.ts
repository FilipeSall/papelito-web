import type { NotificationItem } from "../types/notification";

const STORAGE_PREFIX = "papelito:notifications:last-seen-id";

function buildKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function getLastSeenNotificationId(userId: string): number | null {
  if (!userId) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(buildKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setLastSeenNotificationId(userId: string, id: number) {
  if (!userId || !Number.isFinite(id)) {
    return;
  }

  try {
    window.localStorage.setItem(buildKey(userId), String(id));
  } catch {
    return;
  }
}

export function clearLastSeenNotificationId(userId: string) {
  if (!userId) {
    return;
  }

  try {
    window.localStorage.removeItem(buildKey(userId));
  } catch {
    return;
  }
}

export function pickNewestUnreadId(items: NotificationItem[]): number | null {
  let newest: number | null = null;

  for (const item of items) {
    if (item.readAt) {
      continue;
    }

    if (newest === null || item.id > newest) {
      newest = item.id;
    }
  }

  return newest;
}
