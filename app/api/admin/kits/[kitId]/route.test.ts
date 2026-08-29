import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteAdminKitMock = vi.fn();
const getAdminApiSessionMock = vi.fn();
const revalidatePathMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));

vi.mock("@/lib/server/admin-kits", () => ({
  AdminKitRequestError: class AdminKitRequestError extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
  deleteAdminKit: (...args: unknown[]) => deleteAdminKitMock(...args),
  saveAdminKit: vi.fn(),
}));

import { DELETE } from "./route";

describe("DELETE /api/admin/kits/[kitId]", () => {
  beforeEach(() => {
    deleteAdminKitMock.mockReset();
    getAdminApiSessionMock.mockReset();
    revalidatePathMock.mockReset();
    revalidateTagMock.mockReset();
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    deleteAdminKitMock.mockResolvedValue({
      deleted: true,
      kitId: 12,
      mediaCleanup: { deletedIds: [8], failedIds: [], preservedIds: [] },
      partial: false,
      productId: 91,
    });
  });

  it("encaminha a exclusão autenticada e revalida o catálogo", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/admin/kits/12", { method: "DELETE" }),
      { params: Promise.resolve({ kitId: "12" }) },
    );

    expect(deleteAdminKitMock).toHaveBeenCalledWith("admin-token", 12);
    expect(revalidateTagMock).toHaveBeenCalledWith("admin-kits", "max");
    expect(revalidateTagMock).toHaveBeenCalledWith("wp:kits", "max");
    expect(revalidatePathMock).toHaveBeenCalledWith("/kits");
    expect(await response.json()).toMatchObject({ deleted: true, kitId: 12 });
  });

  it("não revalida quando a API rejeita a exclusão", async () => {
    deleteAdminKitMock.mockRejectedValue(new Error("Kit não encontrado."));

    const response = await DELETE(
      new Request("http://localhost/api/admin/kits/12", { method: "DELETE" }),
      { params: Promise.resolve({ kitId: "12" }) },
    );

    expect(response.status).toBe(500);
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
