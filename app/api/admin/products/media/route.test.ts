import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminApiSessionMock = vi.fn();
const uploadAdminProductMediaMock = vi.fn();

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));

vi.mock("@/lib/server/admin-products", () => ({
  isAdminProductMediaUploadError: (error: unknown) =>
    typeof error === "object" && error !== null && "status" in error && "wordpressCode" in error,
  uploadAdminProductMedia: (...args: unknown[]) => uploadAdminProductMediaMock(...args),
}));

function uploadRequest(name: string, type: string) {
  const file = new File(["image"], name, { type });
  return {
    formData: async () => ({ get: () => file }),
  } as unknown as Request;
}

describe("POST /api/admin/products/media", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    uploadAdminProductMediaMock.mockReset();
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "token" });
  });

  it("uploads a valid product image through the authenticated WordPress proxy", async () => {
    uploadAdminProductMediaMock.mockResolvedValue({ alt: "", id: 42, src: "https://cdn.test/produto.png" });

    const { POST } = await import("./route");
    const response = await POST(uploadRequest("produto.png", "image/png"));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      media: { alt: "", id: 42, src: "https://cdn.test/produto.png" },
    });
    expect(uploadAdminProductMediaMock).toHaveBeenCalledWith("token", expect.any(File));
  });

  it("rejects a non-image before forwarding it", async () => {
    const { POST } = await import("./route");
    const response = await POST(uploadRequest("produto.txt", "text/plain"));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ message: "Formato de imagem não permitido." });
    expect(uploadAdminProductMediaMock).not.toHaveBeenCalled();
  });

  it("keeps the WordPress status while hiding storage details from the user", async () => {
    uploadAdminProductMediaMock.mockRejectedValue({
      status: 503,
      wordpressCode: "papelito_media_upload_directory_unavailable",
    });

    const { POST } = await import("./route");
    const response = await POST(uploadRequest("produto.png", "image/png"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Não foi possível armazenar a imagem. Tente novamente." });
  });
});
