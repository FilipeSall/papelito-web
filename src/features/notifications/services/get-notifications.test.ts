import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import { getNotifications, getUnreadNotificationCount } from "./get-notifications";

describe("get-notifications services", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("loads notifications list", async () => {
    const result = await getNotifications({ page: 1, perPage: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("loads unread notification count", async () => {
    await expect(getUnreadNotificationCount()).resolves.toEqual({ count: 1 });
  });

  it("throws a friendly message on API errors", async () => {
    server.use(
      http.get("/api/notifications/me", () =>
        HttpResponse.json({ message: "Falhou." }, { status: 500 }),
      ),
    );

    await expect(getNotifications()).rejects.toThrow("Falhou.");
  });
});
