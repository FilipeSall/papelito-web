import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminApiSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

import { PUT } from "./route";

describe("PUT /api/admin/integration-secrets/[slug]", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    wpRestMock.mockReset();
  });

  it("forwards the credential payload without interpreting it", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({
      data: { configured: true, last4: "1234", slug: "ga4_api_secret" },
      ok: true,
      status: 200,
    });

    const response = await PUT(
      new Request("http://localhost/api/admin/integration-secrets/ga4_api_secret", {
        body: JSON.stringify({ currentPassword: "senha-atual", secret: "valor-opaco" }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
      { params: Promise.resolve({ slug: "ga4_api_secret" }) },
    );

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/integration-secrets/ga4_api_secret",
      {
        headers: { Authorization: "Bearer admin-token" },
        json: { currentPassword: "senha-atual", secret: "valor-opaco" },
        method: "PUT",
      },
    );
    expect(await response.json()).toEqual({ configured: true, last4: "1234", slug: "ga4_api_secret" });
  });
});
