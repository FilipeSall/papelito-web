export { useNotificationsPoll } from "./hooks/use-notifications-poll";
export {
  getNotifications,
  getUnreadNotificationCount,
} from "./services/get-notifications";
export {
  markAllNotificationsRead,
  markNotificationRead,
} from "./services/mark-notification-read";
export { useNotificationsStore } from "./store/use-notifications-store";
export type {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationItem,
  NotificationPayload,
  NotificationsListResponse,
  NotificationType,
  NotificationUnreadCountResponse,
} from "./types/notification";
export {
  formatNotification,
  formatRelativeTime,
  type FormattedNotification,
} from "./utils/format-notification";
export {
  clearLastSeenNotificationId,
  getLastSeenNotificationId,
  pickNewestUnreadId,
  setLastSeenNotificationId,
} from "./utils/notification-seen-store";
