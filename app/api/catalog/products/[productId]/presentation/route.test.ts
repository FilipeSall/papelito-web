import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ wpRest: vi.fn() }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: mocks.wpRest }));
import { GET } from "./route";

const context = { params: Promise.resolve({ productId: "123" }) };

beforeEach(() => {
  mocks.wpRest.mockResolvedValue({
    ok: true,
    data: { product_id: 123, vendor_id: 45, description: "Vendor", summary: "Resumo", description_source: "vendor" },
  });
});

describe("proxy público de apresentação", () => {
  it("encaminha somente o seletor público e usa no-store", async () => {
    const response = await GET(new Request("http://localhost/api/catalog/products/123/presentation?vendor_id=45"), context);
    expect(mocks.wpRest).toHaveBeenCalledWith("/papelito/v1/products/123/presentation?vendor_id=45");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).not.toHaveProperty("canonical_description");
  });

  it("sem vendor solicita apresentação canônica", async () => {
    await GET(new Request("http://localhost/api/catalog/products/123/presentation"), context);
    expect(mocks.wpRest).toHaveBeenCalledWith("/papelito/v1/products/123/presentation");
  });

  it("recusa IDs ambíguos e fora da faixa segura", async () => {
    for (const vendor of ["0", "-1", "45abc", "9007199254740992"]) {
      expect((await GET(new Request("http://localhost/api/catalog/products/123/presentation?vendor_id=" + vendor), context)).status).toBe(400);
    }
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("mantém erro de elegibilidade sem cache e sem fallback silencioso", async () => {
    mocks.wpRest.mockResolvedValue({ ok: false, status: 403, error: { code: "ineligible", message: "Vendor indisponível." } });
    const response = await GET(new Request("http://localhost/api/catalog/products/123/presentation?vendor_id=45"), context);
    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ code: "ineligible", message: "Vendor indisponível." });
  });
});
