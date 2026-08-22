import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const updateProfileCustomerMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/features/profile/server/customer", () => ({
  updateProfileCustomer: (...args: unknown[]) => updateProfileCustomerMock(...args),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

describe("PATCH /api/profile/document", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    updateProfileCustomerMock.mockReset();
    getServerSessionMock.mockResolvedValue({
      accessToken: "token",
      user: { id: "42" },
    });
  });

  it("rejects a CPF with a valid length but invalid check digits", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile/document", {
        body: JSON.stringify({ document: "111.111.111-11" }),
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(422);
    expect(updateProfileCustomerMock).not.toHaveBeenCalled();
  });
});
