import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveCatalogPdfMock = vi.fn();

vi.mock("@/lib/server/catalog-pdf", () => ({
  resolveCatalogPdf: (...args: unknown[]) => resolveCatalogPdfMock(...args),
}));

describe("GET /api/catalog", () => {
  beforeEach(() => {
    resolveCatalogPdfMock.mockReset();
  });

  it("returns a PDF inline", async () => {
    resolveCatalogPdfMock.mockResolvedValue({
      ok: true,
      bytes: Buffer.from("%PDF-1.4\ncatalog"),
      filename: "catalogo-papelito.pdf",
      source: "default",
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost:3000/api/catalog"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'inline; filename="catalogo-papelito.pdf"',
    );
    expect(response.headers.get("X-Papelito-Catalog-Source")).toBe("default");
  });

  it("does not return HTML or a fake success when no PDF can be resolved", async () => {
    resolveCatalogPdfMock.mockResolvedValue({
      ok: false,
      code: "catalog_not_found",
      message: "Catalogo nao disponivel.",
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost:3000/api/catalog"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(body).toEqual({
      code: "catalog_not_found",
      message: "Catalogo nao disponivel.",
    });
  });
});
