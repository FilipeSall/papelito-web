import { describe, expect, it, vi } from "vitest";

import { DEFAULT_CATALOG_PUBLIC_PATH, resolveCatalogPdf } from "./catalog-pdf";

const PDF_BYTES = Buffer.from("%PDF-1.4\ncatalog");
const HTML_BYTES = Buffer.from("<html>not found</html>");

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function pdfResponse(body = PDF_BYTES, status = 200) {
  return new Response(body, {
    headers: { "Content-Type": "application/pdf" },
    status,
  });
}

function fetchWithSnapshot(snapshot: unknown, pdf?: Response) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes("/papelito/v1/catalog-pdf-info")) {
      return jsonResponse(snapshot);
    }

    return pdf ?? new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
}

describe("resolveCatalogPdf", () => {
  it("uses a valid custom catalog configured in WordPress", async () => {
    const fetchImpl = fetchWithSnapshot(
      {
        activeCatalog: {
          filename: "Catalogo Especial.pdf",
          isAvailable: true,
          source: "custom",
          url: "http://localhost:8080/wp-content/uploads/Catalogo%20Especial.pdf",
        },
      },
      pdfResponse(),
    );

    const result = await resolveCatalogPdf("http://localhost:3000/api/catalog", {
      fetchImpl,
      readFileImpl: vi.fn(),
      wpRestBase: "http://localhost:8080/wp-json",
    });

    expect(result).toMatchObject({
      ok: true,
      filename: "Catalogo-Especial.pdf",
      source: "custom",
    });
  });

  it("falls back when the custom catalog returns 404", async () => {
    const fetchImpl = fetchWithSnapshot(
      {
        activeCatalog: {
          filename: "missing.pdf",
          isAvailable: true,
          source: "custom",
          url: "http://localhost:8080/wp-content/uploads/missing.pdf",
        },
      },
      new Response(null, { status: 404 }),
    );
    const readFileImpl = vi.fn(async () => PDF_BYTES);

    const result = await resolveCatalogPdf("http://localhost:3000/api/catalog", {
      fetchImpl,
      readFileImpl,
      wpRestBase: "http://localhost:8080/wp-json",
    });

    expect(result).toMatchObject({
      ok: true,
      filename: "catalogo-papelito.pdf",
      source: "default",
    });
    expect(readFileImpl).toHaveBeenCalled();
  });

  it("falls back when the configured URL is invalid", async () => {
    const fetchImpl = fetchWithSnapshot({
      activeCatalog: {
        filename: "custom.pdf",
        isAvailable: true,
        source: "custom",
        url: "http://[invalid",
      },
    });
    const readFileImpl = vi.fn(async () => PDF_BYTES);

    const result = await resolveCatalogPdf("http://localhost:3000/api/catalog", {
      fetchImpl,
      readFileImpl,
      wpRestBase: "http://localhost:8080/wp-json",
    });

    expect(result).toMatchObject({ ok: true, source: "default" });
  });

  it("falls back when the custom response is HTML instead of PDF", async () => {
    const fetchImpl = fetchWithSnapshot(
      {
        activeCatalog: {
          filename: "custom.pdf",
          isAvailable: true,
          source: "custom",
          url: "http://localhost:8080/wp-content/uploads/custom.pdf",
        },
      },
      new Response(HTML_BYTES, {
        headers: { "Content-Type": "text/html" },
        status: 200,
      }),
    );
    const readFileImpl = vi.fn(async () => PDF_BYTES);

    const result = await resolveCatalogPdf("http://localhost:3000/api/catalog", {
      fetchImpl,
      readFileImpl,
      wpRestBase: "http://localhost:8080/wp-json",
    });

    expect(result).toMatchObject({ ok: true, source: "default" });
  });

  it("handles filenames and URLs with spaces or special characters", async () => {
    const fetchImpl = fetchWithSnapshot(
      {
        activeCatalog: {
          filename: "Meet __ PDVPerfeito.pdf",
          isAvailable: true,
          source: "custom",
          url: "/wp-content/uploads/Meet __ PDVPerfeito.pdf",
        },
      },
      pdfResponse(),
    );

    const result = await resolveCatalogPdf("http://localhost:3000/api/catalog", {
      fetchImpl,
      readFileImpl: vi.fn(),
      wpRestBase: "http://localhost:8080/wp-json",
    });

    expect(result).toMatchObject({
      ok: true,
      filename: "Meet-__-PDVPerfeito.pdf",
      source: "custom",
    });
    expect(fetchImpl).toHaveBeenLastCalledWith(
      new URL("http://localhost:3000/wp-content/uploads/Meet%20__%20PDVPerfeito.pdf"),
      expect.any(Object),
    );
  });

  it("uses the fallback when WordPress is unavailable", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 503 })) as unknown as typeof fetch;
    const readFileImpl = vi.fn(async () => PDF_BYTES);

    const result = await resolveCatalogPdf("http://localhost:3000/api/catalog", {
      fetchImpl,
      readFileImpl,
      wpRestBase: "http://localhost:8080/wp-json",
    });

    expect(result).toMatchObject({ ok: true, source: "default" });
  });

  it("returns a controlled error when the fallback file is unavailable", async () => {
    const result = await resolveCatalogPdf("http://localhost:3000/api/catalog", {
      fallbackPath: "/missing/catalogo-papelito.pdf",
      fetchImpl: fetchWithSnapshot({
        activeCatalog: {
          isAvailable: false,
          source: "custom",
          url: "http://localhost:8080/wp-content/uploads/missing.pdf",
        },
        defaultCatalog: {
          isAvailable: true,
          source: "default",
          url: DEFAULT_CATALOG_PUBLIC_PATH,
        },
      }),
      readFileImpl: vi.fn(async () => {
        throw new Error("ENOENT");
      }),
      wpRestBase: "http://localhost:8080/wp-json",
    });

    expect(result).toEqual({
      ok: false,
      code: "catalog_not_found",
      message: "Catálogo não disponível.",
    });
  });

  it("rejects a corrupted fallback PDF", async () => {
    const result = await resolveCatalogPdf("http://localhost:3000/api/catalog", {
      fetchImpl: fetchWithSnapshot({ activeCatalog: null }),
      readFileImpl: vi.fn(async () => Buffer.from("broken")),
      wpRestBase: "http://localhost:8080/wp-json",
    });

    expect(result).toEqual({
      ok: false,
      code: "catalog_not_found",
      message: "Catálogo padrão indisponível.",
    });
  });
});
