import { http, HttpResponse } from "msw";

import { buildNotification } from "../../factories/notification";

export const notificationsHandlers = [
  http.get("/api/notifications/me", () =>
    HttpResponse.json({
      items: [buildNotification()],
      total: 1,
      page: 1,
      perPage: 20,
    }),
  ),
  http.get("/api/notifications/me/unread-count", () =>
    HttpResponse.json({
      count: 1,
    }),
  ),
  http.put("/api/notifications/me/:id/read", ({ params }) =>
    HttpResponse.json({
      item: buildNotification({
        id: Number(params.id),
        readAt: "2026-06-07T10:01:00.000Z",
      }),
      unreadCount: 0,
    }),
  ),
  http.put("/api/notifications/me/read-all", () =>
    HttpResponse.json({
      success: true,
      unreadCount: 0,
    }),
  ),
];
