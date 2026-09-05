import { beforeEach, describe, expect, it, vi } from "vitest";

const requireVendorAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("../../../_lib/require-vendor-session", () => ({
  requireVendorAccessToken: () => requireVendorAccessTokenMock(),
  readWithVendorAccessToken: async (load: (accessToken: string) => Promise<unknown>) => {
    const auth = await requireVendorAccessTokenMock();
    return "error" in auth ? auth : { data: await load(auth.accessToken) };
  },
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const { DELETE, GET } = await import("./route");

function request(method: "DELETE" | "GET") {
  return new Request("http://localhost/api/vendor/orders/14094/fiscal-document", { method });
}

const params = Promise.resolve({ id: "14094" });

describe("/api/vendor/orders/[id]/fiscal-document", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
    wpRestMock.mockResolvedValue({ ok: true, data: { can_attach: true, enabled: true } });
  });

  it("não expõe POST: a nota não tem dado digitado para gravar", async () => {
    const route = await import("./route");

    expect("POST" in route).toBe(false);
  });

  it("lê o bloco do pedido", async () => {
    const response = await GET(request("GET"), { params });

    expect(response.status).toBe(200);
    expect(wpRestMock.mock.calls[0][0]).toBe(
      "/papelito/v1/vendor/me/orders/14094/fiscal-document",
    );
  });

  it("recusa a remoção não autenticada sem falar com o WordPress", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ error: "Nao autenticado.", status: 401 });

    const response = await DELETE(request("DELETE"), { params });

    expect(response.status).toBe(401);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("recusa pedido que não é um número sem falar com o WordPress", async () => {
    const response = await DELETE(request("DELETE"), {
      params: Promise.resolve({ id: "14094; DROP" }),
    });

    expect(response.status).toBe(400);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("remove pelo método DELETE, e não por um corpo com flag", async () => {
    const response = await DELETE(request("DELETE"), { params });

    expect(response.status).toBe(200);
    expect(wpRestMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
  });

  it("repassa o status do WordPress quando ele recusa a remoção", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      error: { code: "papelito_fiscal_document_not_found", message: "Nota fiscal não encontrada." },
      status: 404,
    });

    const response = await DELETE(request("DELETE"), { params });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "papelito_fiscal_document_not_found",
    });
  });
});
