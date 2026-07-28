import type { NotificationItem } from "@/features/notifications";

export function buildNotification(
  overrides: Partial<NotificationItem> = {},
): NotificationItem {
  return {
    id: 1,
    type: "favorite_on_promo",
    payload: {
      product_id: 99,
      product_name: "Produto favorito",
      promo_label: "promoção relâmpago",
    },
    readAt: null,
    createdAt: "2026-06-07T10:00:00.000Z",
    ...overrides,
  };
}
