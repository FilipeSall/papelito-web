import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminApiSessionMock = vi.fn();
const deleteAdminMediaMock = vi.fn();

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));

vi.mock("@/lib/server/admin-products", () => ({
  deleteAdminMedia: (...args: unknown[]) => deleteAdminMediaMock(...args),
}));

function deleteRequest(ids: unknown) {
  return new Request("http://localhost/api/admin/media", {
    body: JSON.stringify({ ids }),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  });
}

describe("DELETE /api/admin/media", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    deleteAdminMediaMock.mockReset();
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "token" });
    deleteAdminMediaMock.mockResolvedValue(undefined);
  });

  it("remove somente IDs positivos e únicos", async () => {
    const { DELETE } = await import("./route");
    const response = await DELETE(deleteRequest([8, 8, 0, -1, "9", 12]));

    expect(response.status).toBe(204);
    expect(deleteAdminMediaMock).toHaveBeenCalledTimes(1);
    expect(deleteAdminMediaMock).toHaveBeenCalledWith("token", [8, 12]);
  });

  it("exige uma sessão administrativa", async () => {
    getAdminApiSessionMock.mockResolvedValue({
      error: "Acesso negado.",
      status: 403,
    });
    const { DELETE } = await import("./route");
    const response = await DELETE(deleteRequest([8]));

    expect(response.status).toBe(403);
    expect(deleteAdminMediaMock).not.toHaveBeenCalled();
  });
});
