import { describe, expect, it, vi } from "vitest";

import { DIRECT_UPLOAD_MAX_BYTES, DirectUploadError, uploadDirectFile } from "./direct-upload";

describe("uploadDirectFile", () => {
  it("authorizes a small request then sends the file directly to WordPress", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ticket: "a".repeat(43),
            uploadUrl: "https://wordpress.test/wp-json/papelito/v1/uploads/direct",
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ media: { id: 12, src: "https://wordpress.test/image.jpg" } }), {
          status: 201,
        }),
      );

    const result = await uploadDirectFile<{ media: { id: number; src: string } }>(
      "media",
      new File(["image"], "imagem.jpg", { type: "image/jpeg" }),
    );

    expect(result.media.id).toBe(12);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/uploads/ticket",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://wordpress.test/wp-json/papelito/v1/uploads/direct",
      expect.objectContaining({
        headers: { "X-Papelito-Upload-Ticket": "a".repeat(43) },
        method: "POST",
      }),
    );
  });

  it("rejects a file above 10 MB before requesting a ticket", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const file = new File(["image"], "imagem.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: DIRECT_UPLOAD_MAX_BYTES + 1 });

    await expect(uploadDirectFile("media", file)).rejects.toThrow("limite de 10 MB");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // O chamador precisa distinguir "candidatura não aceita documento" (409) de falha de rede para
  // decidir se oferece nova tentativa. Antes todo erro colapsava num Error sem status.
  it("preserves the WordPress status and code when the upload is refused", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ticket: "b".repeat(43),
            uploadUrl: "https://wordpress.test/wp-json/papelito/v1/uploads/direct",
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "papelito_pre_account_upload_not_allowed",
            message: "Esta candidatura não aceita um novo documento.",
          }),
          { status: 409 },
        ),
      );

    const error = await uploadDirectFile("pre-account-document", new File(["x"], "doc.png")).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(DirectUploadError);
    expect((error as DirectUploadError).status).toBe(409);
    expect((error as DirectUploadError).code).toBe("papelito_pre_account_upload_not_allowed");
    expect((error as DirectUploadError).message).toBe("Esta candidatura não aceita um novo documento.");
  });

  // A mensagem acionável vem pronta do WordPress: com o upload direto não há mais proxy Next para
  // traduzir o código de erro do wp/v2/media.
  it("surfaces the actionable message when the image is refused by validation", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ticket: "c".repeat(43),
            uploadUrl: "https://wordpress.test/wp-json/papelito/v1/uploads/direct",
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "papelito_image_content_mismatch",
            message:
              "O conteúdo do arquivo não corresponde à extensão informada. Salve a imagem no formato correto e envie novamente.",
          }),
          { status: 415 },
        ),
      );

    const error = await uploadDirectFile("media", new File(["x"], "foto.jpg")).catch(
      (caught: unknown) => caught,
    );

    expect((error as DirectUploadError).status).toBe(415);
    expect((error as DirectUploadError).message).toContain("não corresponde à extensão informada");
  });

  it("keeps the size message on 413 instead of the raw server text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Request Entity Too Large" }), { status: 413 }),
    );

    const error = await uploadDirectFile("media", new File(["x"], "foto.jpg")).catch(
      (caught: unknown) => caught,
    );

    expect((error as DirectUploadError).message).toBe("O arquivo excede o limite de 10 MB.");
    expect((error as DirectUploadError).status).toBe(413);
  });
});
