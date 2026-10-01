import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ wpRest: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: mocks.wpRest }));
import { getProductPresentation } from "./get-product-presentation";

const presentation = {
  product_id: 123, vendor_id: 45, description: "<p>Vendor</p>", summary: "Resumo", description_source: "vendor",
};

describe("apresentação no servidor", () => {
  it("tipa o contrato e preserva o contexto solicitado", async () => {
    mocks.wpRest.mockResolvedValue({ ok: true, data: presentation });
    expect(await getProductPresentation(123, 45)).toEqual({
      productId: 123, vendorId: 45, description: "<p>Vendor</p>", summary: "Resumo", descriptionSource: "vendor",
    });
  });

  it("recusa resposta de outro produto/vendor e falhas técnicas", async () => {
    for (const data of [
      { ...presentation, product_id: 124 },
      { ...presentation, vendor_id: 46 },
      { ...presentation, description_source: "unknown" },
    ]) {
      mocks.wpRest.mockResolvedValue({ ok: true, data });
      await expect(getProductPresentation(123, 45)).rejects.toThrow("outro contexto");
    }
    mocks.wpRest.mockResolvedValue({ ok: false, error: { message: "Falha de banco." } });
    await expect(getProductPresentation(123, 45)).rejects.toThrow("Falha de banco.");
  });
});
