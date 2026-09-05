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

  it("updates uniform variable-product prices in one variations batch and rehydrates them", async () => {
    const parent = { id: 11856, name: "Produto", type: "variable" };
    const variations = [
      { id: 11857, regular_price: "140", sale_price: "" },
      { id: 11858, regular_price: "140", sale_price: "" },
      { id: 11859, regular_price: "140", sale_price: "" },
    ];
    const updatedVariations = variations.map((variation) => ({
      ...variation,
      date_on_sale_from: "2026-08-01T00:00:00",
      date_on_sale_to: "2026-08-31T23:59:59",
      regular_price: "150",
      sale_price: "120",
    }));
    wpRestMock
      .mockResolvedValueOnce({
        data: parent,
        headers: new Headers(),
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        data: variations,
        headers: new Headers(),
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        data: { update: updatedVariations },
        headers: new Headers(),
        ok: true,
        status: 200,
      });
    const { updateAdminProduct } = await import("./admin-products");

    const product = await updateAdminProduct("token", 11856, {
      regularPrice: "150",
      salePrice: "120",
      dateOnSaleFrom: "2026-08-01T00:00:00",
      dateOnSaleTo: "2026-08-31T23:59:59",
    });

    expect(wpRestMock).toHaveBeenCalledWith("/wc/v3/products/11856", {
      headers: { Authorization: "Bearer token" },
      revalidate: 0,
    });
    expect(wpRestMock).toHaveBeenCalledWith(
      "/wc/v3/products/11856/variations/batch",
      {
        headers: { Authorization: "Bearer token" },
        json: {
          update: updatedVariations.map((variation) => ({
            date_on_sale_from: "2026-08-01T00:00:00",
            date_on_sale_to: "2026-08-31T23:59:59",
            id: variation.id,
            regular_price: "150",
            sale_price: "120",
          })),
        },
        method: "PUT",
      },
    );
    expect(product.regularPrice).toBe("150");
    expect(product.salePrice).toBe("120");
    expect(product.dateOnSaleFrom).toBe("2026-08-01T00:00:00");
    expect(product.dateOnSaleTo).toBe("2026-08-31T23:59:59");
  });

  it("hydrates uniform variation prices after reopening a product", async () => {
    wpRestMock
      .mockResolvedValueOnce({
        data: { id: 11856, name: "Produto", type: "variable" },
        headers: new Headers(),
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        data: [
          { id: 11857, regular_price: "150", sale_price: "120" },
          { id: 11858, regular_price: "150", sale_price: "120" },
        ],
        headers: new Headers(),
        ok: true,
        status: 200,
      });
    const { getAdminProduct } = await import("./admin-products");

    await expect(getAdminProduct("token", 11856)).resolves.toMatchObject({
      regularPrice: "150",
      salePrice: "120",
    });
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

  it("runs the SKU backfill through the WordPress admin contract", async () => {
    const summary = {
      dryRun: true,
      errors: [],
      failed: 0,
      generated: 0,
      items: [{ id: 11836, name: "Bandeja M", sku: "PPL-011836", status: "would_generate" }],
      missing: 1,
      scanned: 1,
      skipped: 0,
    };
    wpRestMock.mockResolvedValue({
      data: summary,
      headers: new Headers(),
      ok: true,
      status: 200,
    });
    const { backfillAdminProductSkus } = await import("./admin-products");

    await expect(backfillAdminProductSkus("token", { batch: 100, dryRun: true })).resolves.toEqual(summary);
    expect(wpRestMock).toHaveBeenCalledWith("/papelito/v1/admin/products/sku-backfill", {
      headers: { Authorization: "Bearer token" },
      json: { batch: 100, dryRun: true },
      method: "POST",
    });
  });
});
