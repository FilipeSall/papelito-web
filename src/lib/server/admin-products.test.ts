import { beforeEach, describe, expect, it, vi } from "vitest";

const getWpRestBaseMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("@/lib/server/env", () => ({
  getWpRestBase: () => getWpRestBaseMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

describe("admin product media", () => {
  beforeEach(() => {
    getWpRestBaseMock.mockReset();
    wpRestMock.mockReset();
    getWpRestBaseMock.mockReturnValue("http://localhost:8080/wp-json");
  });

  it("sends media to WordPress as multipart form data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ alt_text: "Imagem", id: 42, source_url: "https://cdn.test/produto.png" }), {
        status: 201,
      }),
    );
    const { uploadAdminProductMedia } = await import("./admin-products");

    const media = await uploadAdminProductMedia(
      "token",
      new File(["image"], "produto com espaço.png", { type: "image/png" }),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as FormData;
    const uploaded = body.get("file");

    expect(init.headers).toEqual({ Authorization: "Bearer token" });
    expect(uploaded).toBeInstanceOf(File);
    expect((uploaded as File).name).toBe("produto-com-espa-o.png");
    expect(media).toEqual({ alt: "Imagem", id: 42, src: "https://cdn.test/produto.png" });
  });

  it("preserves an upstream WordPress storage failure as a typed error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "papelito_media_upload_directory_unavailable",
          message: "The uploaded file could not be moved to wp-content/uploads/2026/07.",
        }),
        { status: 503 },
      ),
    );
    const { AdminProductMediaUploadError, uploadAdminProductMedia } = await import("./admin-products");

    await expect(
      uploadAdminProductMedia("token", new File(["image"], "produto.png", { type: "image/png" })),
    ).rejects.toEqual(
      expect.objectContaining({
        status: 503,
        wordpressCode: "papelito_media_upload_directory_unavailable",
      }),
    );

    expect(AdminProductMediaUploadError).toBeTypeOf("function");
  });

  it("associates uploaded media IDs with the WooCommerce product payload", async () => {
    wpRestMock.mockResolvedValue({
      data: { id: 11838, images: [{ id: 42, position: 0, src: "https://cdn.test/produto.png" }] },
      ok: true,
    });
    const { createAdminProduct } = await import("./admin-products");

    await createAdminProduct("token", { images: [42, 84], name: "Produto" });

    expect(wpRestMock).toHaveBeenCalledWith("/wc/v3/products", {
      headers: { Authorization: "Bearer token" },
      json: {
        images: [{ id: 42, position: 0 }, { id: 84, position: 1 }],
        name: "Produto",
      },
    });
  });

  it("reuses an existing tag with the same normalized name instead of creating a duplicate", async () => {
    const existingTag = { id: 215, name: "Teste", parent: 0, slug: "teste" };
    wpRestMock.mockResolvedValue({
      data: [existingTag],
      headers: new Headers(),
      ok: true,
      status: 200,
    });
    const { createAdminProductTag } = await import("./admin-products");

    await expect(createAdminProductTag("token", { name: "  teste  " })).resolves.toEqual(
      existingTag,
    );

    expect(wpRestMock).toHaveBeenCalledWith(
      "/wc/v3/products/tags?order=asc&orderby=name&per_page=100&search=teste",
      { headers: { Authorization: "Bearer token" } },
    );
    expect(wpRestMock).toHaveBeenCalledTimes(1);
  });

  it("saves the full tag ID set through the existing WooCommerce product update", async () => {
    const tag = { id: 215, name: "teste", parent: 0, slug: "teste" };
    wpRestMock.mockResolvedValue({
      data: { id: 11856, name: "Produto", tags: [tag] },
      headers: new Headers(),
      ok: true,
      status: 200,
    });
    const { updateAdminProduct } = await import("./admin-products");

    const product = await updateAdminProduct("token", 11856, { tags: [215] });

    expect(wpRestMock).toHaveBeenCalledWith("/wc/v3/products/11856", {
      headers: { Authorization: "Bearer token" },
      json: { tags: [{ id: 215 }] },
      method: "PUT",
    });
    expect(product.tags).toEqual([tag]);
  });

  it("hydrates tags from product responses with three collection requests for forty products", async () => {
    const tag = { id: 215, name: "teste", parent: 0, slug: "teste" };
    const products = Array.from({ length: 40 }, (_, index) => ({
      id: 11856 + index,
      name: `Produto ${index + 1}`,
      tags: [tag],
    }));
    wpRestMock
      .mockResolvedValueOnce({
        data: products,
        headers: new Headers({ "X-WP-Total": "40", "X-WP-TotalPages": "1" }),
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        data: [],
        headers: new Headers(),
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        data: [],
        headers: new Headers(),
        ok: true,
        status: 200,
      });
    const { getAdminProductsSnapshot } = await import("./admin-products");

    const result = await getAdminProductsSnapshot("token", { perPage: "40" });

    expect(wpRestMock).toHaveBeenCalledTimes(3);
    expect(result.products).toHaveLength(40);
    expect(result.products.every((product) => product.tags[0]?.id === 215)).toBe(true);
    expect(result.tags).toEqual([tag]);
  });
});
