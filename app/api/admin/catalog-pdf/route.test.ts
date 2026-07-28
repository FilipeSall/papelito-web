import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminApiSessionMock = vi.fn();
const getWpRestBaseMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));

vi.mock("@/lib/server/env", () => ({
  getWpRestBase: () => getWpRestBaseMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("/api/admin/catalog-pdf", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    getWpRestBaseMock.mockReset();
    wpRestMock.mockReset();
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "token" });
    getWpRestBaseMock.mockReturnValue("http://localhost:8080/wp-json");
  });

  it("returns the admin catalog snapshot", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: {
        activeCatalog: { source: "default", url: "/pdf/catalogo-papelito.pdf" },
        configuredCatalog: null,
      },
    });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(wpRestMock).toHaveBeenCalledWith("/papelito/v1/catalog-pdf-info", {
      cache: "no-store",
      headers: { Authorization: "Bearer token" },
    });
  });

  it("rejects uploads from users without admin permission", async () => {
    getAdminApiSessionMock.mockResolvedValue({ error: "Acesso negado.", status: 403 });
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/catalog-pdf", {
        body: new FormData(),
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects requests without an uploaded PDF", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/catalog-pdf", {
        body: new FormData(),
        method: "POST",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({ message: "Arquivo PDF obrigatório." });
  });
});
