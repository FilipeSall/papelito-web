import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { server } from "../../../test/msw/server";
import { getAdminApiSession } from "./admin-api-auth";

const AUTH_ME_URL = "http://localhost:8080/wp-json/papelito/v1/auth/me";

const getServerSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

describe("getAdminApiSession", () => {
  afterEach(() => {
    getServerSessionMock.mockReset();
  });

  it("denies access when the session role is stale admin but WordPress says seller", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "2158" },
      accessToken: "seller-token",
      role: "administrator",
    });

    const result = await getAdminApiSession();

    expect(result).toEqual({ error: "Acesso negado.", status: 403 });
  });

  it("allows access when WordPress confirms the token is administrator", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "486" },
      accessToken: "admin-token",
      role: "customer",
    });

    const result = await getAdminApiSession();

    expect(result).toEqual({ accessToken: "admin-token" });
  });

  it("fails closed when the WordPress identity check fails", async () => {
    server.use(http.get(AUTH_ME_URL, () => new HttpResponse(null, { status: 401 })));
    getServerSessionMock.mockResolvedValue({
      user: { id: "486" },
      accessToken: "admin-token",
      role: "administrator",
    });

    const result = await getAdminApiSession();

    expect(result).toEqual({ error: "Acesso negado.", status: 403 });
  });
});
