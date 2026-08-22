import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const updateProfileCustomerMock = vi.fn();
const fetchCurrentUserRoleMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/features/profile/server/customer", () => ({
  updateProfileCustomer: (...args: unknown[]) => updateProfileCustomerMock(...args),
}));

vi.mock("@/lib/server/current-user-role", () => ({
  fetchCurrentUserRole: (...args: unknown[]) => fetchCurrentUserRoleMock(...args),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

describe("PATCH /api/profile/account", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    updateProfileCustomerMock.mockReset();
    fetchCurrentUserRoleMock.mockReset();
    getServerSessionMock.mockResolvedValue({
      accessToken: "token",
      role: "customer",
      user: { id: "42" },
    });
    fetchCurrentUserRoleMock.mockResolvedValue("customer");
  });

  it("rejects an invalid CPF even when the browser claims the user is a seller", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile/account", {
        body: JSON.stringify({
          cpf: "111.111.111-11",
          email: "cliente@papelito.test",
          firstName: "Ana",
          lastName: "Silva",
          role: "seller",
        }),
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(422);
    expect(updateProfileCustomerMock).not.toHaveBeenCalled();
  });
});
