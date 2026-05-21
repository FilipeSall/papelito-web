export type NotificationType =
  | "new_vendor_application"
  | "favorite_on_promo"
  | "vendor_approved"
  | "vendor_rejected"
  | "stock_zeroed";

export type NotificationPayload = Record<string, unknown>;

export type NotificationItem = {
  id: number;
  type: NotificationType;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsListResponse = {
  items: NotificationItem[];
  total: number;
  page: number;
  perPage: number;
};

export type NotificationUnreadCountResponse = {
  count: number;
};

export type MarkNotificationReadResponse = {
  item: NotificationItem | null;
  unreadCount: number;
};

export type MarkAllNotificationsReadResponse = {
  success: boolean;
  unreadCount: number;
};
