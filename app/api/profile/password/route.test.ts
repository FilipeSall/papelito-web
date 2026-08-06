import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const updateProfileCustomerMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/features/profile/server/customer", () => ({
  updateProfileCustomer: (...args: unknown[]) => updateProfileCustomerMock(...args),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

describe("PATCH /api/profile/password", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    updateProfileCustomerMock.mockReset();
    wpRestMock.mockReset();
    getServerSessionMock.mockResolvedValue({
      accessToken: "token",
      user: { id: "42" },
    });
  });

  it("rejects a password change without the current password", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile/password", {
        body: JSON.stringify({ password: "nova-senha", confirmPassword: "nova-senha" }),
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(422);
    expect(wpRestMock).not.toHaveBeenCalled();
    expect(updateProfileCustomerMock).not.toHaveBeenCalled();
  });

  it("forwards the password proof only to the dedicated WordPress endpoint", async () => {
    wpRestMock.mockResolvedValue({ data: { ok: true }, ok: true, status: 200 });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile/password", {
        body: JSON.stringify({
          confirmPassword: "nova-senha",
          currentPassword: "senha-atual",
          password: "nova-senha",
        }),
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(200);
    expect(wpRestMock).toHaveBeenCalledWith("/papelito/v1/auth/change-password", {
      headers: { Authorization: "Bearer token" },
      json: {
        confirmPassword: "nova-senha",
        currentPassword: "senha-atual",
        password: "nova-senha",
      },
      method: "POST",
    });
    expect(updateProfileCustomerMock).not.toHaveBeenCalled();
  });
});
