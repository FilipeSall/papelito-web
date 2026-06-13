import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const updateProfileCustomerMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/features/profile/server/customer", () => ({
  updateProfileCustomer: (...args: unknown[]) =>
    updateProfileCustomerMock(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

describe("PATCH /api/profile/preferences", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    updateProfileCustomerMock.mockReset();
  });

  it("returns 401 when the user is not authenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile/preferences", {
        method: "PATCH",
        body: JSON.stringify({ favoritePromotionEmailEnabled: true }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("validates the incoming payload", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "42" },
      accessToken: "token",
    });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile/preferences", {
        method: "PATCH",
        body: JSON.stringify({ favoritePromotionEmailEnabled: "sim" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("persists the preference through updateCustomer metadata", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "42" },
      accessToken: "token",
    });
    updateProfileCustomerMock.mockResolvedValue({
      preferences: {
        favoritePromotionEmailEnabled: true,
      },
    });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile/preferences", {
        method: "PATCH",
        body: JSON.stringify({ favoritePromotionEmailEnabled: true }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateProfileCustomerMock).toHaveBeenCalledWith("token", {
      metaData: [
        {
          key: "papelito_favorite_promo_email_enabled",
          value: "1",
        },
      ],
    });
    expect(body).toEqual({
      preferences: {
        favoritePromotionEmailEnabled: true,
      },
    });
  });
});
