import { beforeEach, describe, expect, it, vi } from "vitest";

import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/server/image-upload";

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

const TINY_WEBP = "UklGRh4AAABXRUJQVlA4TBEAAAAvAUAAAAdQhSIXpf+BiOh/AAA=";
const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGM8waXBwMDAxMDAwMDAAAAMggD+GTGwQwAAAABJRU5ErkJggg==";

function bytesFrom(base64: string) {
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function uploadRequest(file: File) {
  return {
    formData: async () => ({ get: () => file }),
  } as unknown as Request;
}

function imageRequest(base64: string, name: string, type: string) {
  return uploadRequest(new File([bytesFrom(base64)], name, { type }));
}

describe("POST /api/admin/products/media", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    uploadAdminProductMediaMock.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "token" });
  });

  it("envia um WebP válido informando o MIME type detectado ao WordPress", async () => {
    uploadAdminProductMediaMock.mockResolvedValue({
      alt: "",
      id: 42,
      src: "https://cdn.test/produto.webp",
    });

    const { POST } = await import("./route");
    const response = await POST(imageRequest(TINY_WEBP, "produto.webp", "image/webp"));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      media: { alt: "", id: 42, src: "https://cdn.test/produto.webp" },
    });
    expect(uploadAdminProductMediaMock).toHaveBeenCalledWith("token", expect.any(File), {
      contentType: "image/webp",
      fileName: "produto.webp",
    });
  });

  it("envia um PNG válido", async () => {
    uploadAdminProductMediaMock.mockResolvedValue({
      alt: "",
      id: 43,
      src: "https://cdn.test/produto.png",
    });

    const { POST } = await import("./route");
    const response = await POST(imageRequest(TINY_PNG, "produto.png", "image/png"));

    expect(response.status).toBe(201);
    expect(uploadAdminProductMediaMock).toHaveBeenCalledWith("token", expect.any(File), {
      contentType: "image/png",
      fileName: "produto.png",
    });
  });

  it("rejeita um arquivo que não é imagem antes de encaminhar", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      uploadRequest(
        new File([new TextEncoder().encode("texto puro")], "produto.txt", { type: "text/plain" }),
      ),
    );

    expect(response.status).toBe(415);
    expect((await response.json()).message).toContain("não é uma imagem reconhecida");
    expect(uploadAdminProductMediaMock).not.toHaveBeenCalled();
  });

  it("rejeita conteúdo de outro tipo apenas renomeado para .webp", async () => {
    const { POST } = await import("./route");
    const response = await POST(imageRequest(TINY_PNG, "produto.webp", "image/webp"));

    expect(response.status).toBe(415);
    expect((await response.json()).message).toContain("não corresponde à extensão");
    expect(uploadAdminProductMediaMock).not.toHaveBeenCalled();
  });

  it("rejeita uma imagem corrompida antes de encaminhar", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      uploadRequest(
        new File([bytesFrom(TINY_WEBP).slice(0, 20)], "produto.webp", { type: "image/webp" }),
      ),
    );

    expect(response.status).toBe(422);
    expect((await response.json()).message).toContain("corrompida ou incompleta");
    expect(uploadAdminProductMediaMock).not.toHaveBeenCalled();
  });

  it("rejeita imagem acima do limite de tamanho", async () => {
    const file = new File([bytesFrom(TINY_WEBP)], "produto.webp", { type: "image/webp" });
    Object.defineProperty(file, "size", { value: PRODUCT_IMAGE_MAX_BYTES + 1 });

    const { POST } = await import("./route");
    const response = await POST(uploadRequest(file));

    expect(response.status).toBe(413);
    expect((await response.json()).message).toContain("limite");
    expect(uploadAdminProductMediaMock).not.toHaveBeenCalled();
  });

  it("explica quando o servidor de mídia não processa o formato", async () => {
    uploadAdminProductMediaMock.mockRejectedValue({
      status: 400,
      wordpressCode: "rest_upload_image_type_not_supported",
      wordpressMessage: "The web server cannot generate responsive image sizes for this image.",
    });

    const { POST } = await import("./route");
    const response = await POST(imageRequest(TINY_WEBP, "produto.webp", "image/webp"));

    expect(response.status).toBe(415);
    expect((await response.json()).message).toContain("Envie a imagem em PNG ou JPEG");
  });

  it("traduz falha do serviço de armazenamento sem expor detalhes técnicos", async () => {
    uploadAdminProductMediaMock.mockRejectedValue({
      status: 503,
      wordpressCode: "papelito_media_upload_directory_unavailable",
      wordpressMessage: "Directory not writable: /var/www/uploads",
    });

    const { POST } = await import("./route");
    const response = await POST(imageRequest(TINY_WEBP, "produto.webp", "image/webp"));

    expect(response.status).toBe(502);

    const body = await response.json();

    expect(body.message).toBe(
      "Não foi possível armazenar a imagem no servidor de mídia. Tente novamente.",
    );
    expect(JSON.stringify(body)).not.toContain("/var/www/uploads");
  });

  it("não expõe stack trace em erro inesperado", async () => {
    uploadAdminProductMediaMock.mockRejectedValue(new Error("ECONNREFUSED 127.0.0.1:8080"));

    const { POST } = await import("./route");
    const response = await POST(imageRequest(TINY_WEBP, "produto.webp", "image/webp"));

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body.message).toBe("Erro interno ao enviar a imagem. Tente novamente.");
    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
  });

  it("mantém a exigência de autenticação de administrador", async () => {
    getAdminApiSessionMock.mockResolvedValue({ error: "Acesso negado.", status: 403 });

    const { POST } = await import("./route");
    const response = await POST(imageRequest(TINY_WEBP, "produto.webp", "image/webp"));

    expect(response.status).toBe(403);
    expect(uploadAdminProductMediaMock).not.toHaveBeenCalled();
  });
});
