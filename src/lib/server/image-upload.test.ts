import { describe, expect, it } from "vitest";

import {
  PRODUCT_IMAGE_MAX_BYTES,
  detectImageMimeType,
  validateImageUpload,
} from "./image-upload";

const TINY_WEBP =
  "UklGRh4AAABXRUJQVlA4TBEAAAAvAUAAAAdQhSIXpf+BiOh/AAA=";
const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGM8waXBwMDAxMDAwMDAAAAMggD+GTGwQwAAAABJRU5ErkJggg==";
const TINY_JPEG =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAACAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDhaKKK4D9TP//Z";

function bytesFrom(base64: string) {
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function fileFrom(base64: string, name: string, type: string) {
  const bytes = bytesFrom(base64);
  return new File([bytes], name, { type });
}

function avifBytes() {
  const header = [
    0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0x00, 0x00, 0x00, 0x00,
    0x61, 0x76, 0x69, 0x66, 0x6d, 0x69, 0x66, 0x31, 0x6d, 0x69, 0x61, 0x66,
  ];
  return new Uint8Array([...header, ...new Array(64).fill(0x21)]);
}

describe("detectImageMimeType", () => {
  it("identifica os formatos suportados pelo conteúdo real", () => {
    expect(detectImageMimeType(bytesFrom(TINY_WEBP))).toBe("image/webp");
    expect(detectImageMimeType(bytesFrom(TINY_PNG))).toBe("image/png");
    expect(detectImageMimeType(bytesFrom(TINY_JPEG))).toBe("image/jpeg");
    expect(detectImageMimeType(avifBytes())).toBe("image/avif");
    expect(detectImageMimeType(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01]))).toBe(
      "image/gif",
    );
  });

  it("não identifica conteúdo que não é imagem", () => {
    expect(detectImageMimeType(new TextEncoder().encode("<?php echo 1; ?>"))).toBeNull();
  });
});

describe("validateImageUpload", () => {
  it("aceita um WebP válido e normaliza o nome do arquivo", async () => {
    const result = await validateImageUpload(
      fileFrom(TINY_WEBP, "Foto do Produto (1).webp", "image/webp"),
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.mimeType).toBe("image/webp");
      expect(result.fileName).toBe("Foto-do-Produto-1.webp");
    }
  });

  it("aceita PNG e JPEG válidos", async () => {
    const png = await validateImageUpload(fileFrom(TINY_PNG, "produto.png", "image/png"));
    const jpeg = await validateImageUpload(fileFrom(TINY_JPEG, "produto.jpg", "image/jpeg"));

    expect(png.ok && png.mimeType).toBe("image/png");
    expect(jpeg.ok && jpeg.mimeType).toBe("image/jpeg");
  });

  it("aceita WebP quando o navegador não informa o MIME type", async () => {
    const result = await validateImageUpload(fileFrom(TINY_WEBP, "produto.webp", ""));

    expect(result.ok && result.mimeType).toBe("image/webp");
  });

  it("rejeita conteúdo de outro tipo apenas renomeado para .webp", async () => {
    const result = await validateImageUpload(fileFrom(TINY_PNG, "produto.webp", "image/webp"));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.rejection.reason).toBe("content_mismatch");
    }
  });

  it("rejeita um WebP truncado/corrompido", async () => {
    const original = bytesFrom(TINY_WEBP);
    const truncated = original.slice(0, 20);
    const result = await validateImageUpload(
      new File([truncated], "produto.webp", { type: "image/webp" }),
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.rejection.reason).toBe("truncated");
    }
  });

  it("rejeita um PNG truncado/corrompido", async () => {
    const truncated = bytesFrom(TINY_PNG).slice(0, 40);
    const result = await validateImageUpload(
      new File([truncated], "produto.png", { type: "image/png" }),
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.rejection.reason).toBe("truncated");
    }
  });

  it("rejeita arquivo que não é imagem mesmo com extensão de imagem", async () => {
    const result = await validateImageUpload(
      new File([new TextEncoder().encode("<?php echo 1; ?>")], "produto.png", {
        type: "image/png",
      }),
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.rejection.reason).toBe("unknown_content");
    }
  });

  it("rejeita arquivo vazio", async () => {
    const result = await validateImageUpload(new File([], "produto.webp", { type: "image/webp" }));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.rejection.reason).toBe("empty");
    }
  });

  it("rejeita arquivo acima do limite sem ler o conteúdo", async () => {
    const file = fileFrom(TINY_WEBP, "produto.webp", "image/webp");
    Object.defineProperty(file, "size", { value: PRODUCT_IMAGE_MAX_BYTES + 1 });

    const result = await validateImageUpload(file);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.rejection.reason).toBe("too_large");
    }
  });
});
