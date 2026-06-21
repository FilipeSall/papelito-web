import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchCurrentUserRoleMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/lib/server/current-user-role", () => ({
  fetchCurrentUserRole: (...args: unknown[]) => fetchCurrentUserRoleMock(...args),
}));

vi.mock("@/lib/server/env", () => ({
  getWpGraphqlEndpoint: () => "http://wp.test/graphql",
}));

describe("fetchProfileCustomer", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchCurrentUserRoleMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("hydrates email notification preferences from the metadata query", async () => {
    fetchCurrentUserRoleMock.mockResolvedValue("customer");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            customer: {
              firstName: "Ana",
              lastName: "Silva",
              email: "ana@example.com",
              billing: null,
              shipping: null,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            customer: {
              displayName: "Ana Silva",
              role: "customer",
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            customer: {
              metaData: [
                {
                  key: "papelito_favorite_promo_email_enabled",
                  value: "1",
                },
              ],
            },
          },
        }),
      });

    const { fetchProfileCustomer } = await import("./customer");
    const customer = await fetchProfileCustomer("token");

    expect(customer.preferences.favoritePromotionEmailEnabled).toBe(true);
  });
});
