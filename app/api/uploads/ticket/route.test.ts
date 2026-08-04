import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const getAdminApiSessionMock = vi.fn();
const getUserApiSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("next/headers", () => ({ cookies: () => cookiesMock() }));
vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));
vi.mock("@/lib/server/company-api", () => ({
  getUserApiSession: () => getUserApiSessionMock(),
}));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: (...args: unknown[]) => wpRestMock(...args) }));

describe("/api/uploads/ticket", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    getAdminApiSessionMock.mockReset();
    getUserApiSessionMock.mockReset();
    wpRestMock.mockReset();
    cookiesMock.mockResolvedValue({ get: () => undefined });
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    getUserApiSessionMock.mockResolvedValue({ accessToken: "user-token" });
    wpRestMock.mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        ticket: "a".repeat(43),
        uploadUrl: "https://wordpress.test/wp-json/papelito/v1/uploads/direct",
      },
    });
  });

  it("issues an admin ticket without exposing the WordPress access token", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/uploads/ticket", {
        body: JSON.stringify({ purpose: "media" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).not.toHaveProperty("accessToken");
    expect(wpRestMock).toHaveBeenCalledWith("/papelito/v1/uploads/tickets", {
      headers: { Authorization: "Bearer admin-token" },
      json: { purpose: "media" },
      method: "POST",
    });
  });

  it("uses the private application cookie only for a pre-account document ticket", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "private-application-token" }) });
    const { POST } = await import("./route");
    await POST(
      new Request("http://localhost/api/uploads/ticket", {
        body: JSON.stringify({ purpose: "pre-account-document" }),
        method: "POST",
      }),
    );

    expect(wpRestMock).toHaveBeenCalledWith("/papelito/v1/uploads/tickets", {
      headers: { "X-Papelito-Application-Token": "private-application-token" },
      json: { purpose: "pre-account-document" },
      method: "POST",
    });
  });
});
