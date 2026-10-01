import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), read: vi.fn(), wpRest: vi.fn(), revalidateTag: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock("../../../_lib/require-vendor-session", () => ({ requireVendorAccessToken: mocks.auth, readWithVendorAccessToken: mocks.read }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: mocks.wpRest }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag, revalidatePath: mocks.revalidatePath }));

import { DELETE, GET, PUT } from "./route";

const context = { params: Promise.resolve({ productId: "123" }) };
function request(body?: unknown) {
  return new Request("http://localhost/api/vendor/products/123/customization", {
    method: body === undefined ? "GET" : "PUT",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ accessToken: "server-only-token" });
  mocks.read.mockImplementation(async (load: (token: string) => Promise<unknown>) => ({ data: await load("server-only-token") }));
  mocks.wpRest.mockResolvedValue({ ok: true, data: { product_id: 123, vendor_description: null } });
});

describe("proxy de personalização", () => {
  it("não chama WordPress sem sessão autorizada", async () => {
    mocks.auth.mockResolvedValue({ error: "Não autenticado.", status: 401 });
    expect((await PUT(request({ description: "X" }), context)).status).toBe(401);
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("recusa identidade e null no corpo", async () => {
    for (const body of [{ vendor_id: 2, description: "X" }, { description: null }, {}, { description: "X", use_vendor_description: "sim" }]) {
      expect((await PUT(request(body), context)).status).toBe(422);
    }
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("GET é privado e não invalida nada", async () => {
    const response = await GET(request(), context);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.wpRest).toHaveBeenCalledWith("/papelito/v1/vendor/me/products/123/customization", {
      method: "GET", headers: { Authorization: "Bearer server-only-token" },
    });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("GET não devolve a personalização quando o token não é de seller", async () => {
    mocks.read.mockResolvedValue({ error: "Acesso restrito a vendors.", status: 403 });
    const response = await GET(request(), context);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Acesso restrito a vendors." });
  });

  it("GET recusa produto inválido antes de consultar sessão ou WordPress", async () => {
    const response = await GET(request(), { params: Promise.resolve({ productId: "0" }) });
    expect(response.status).toBe(400);
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("PUT repassa a escolha de exibir o texto", async () => {
    await PUT(request({ description: "<p>X</p>", use_vendor_description: false }), context);
    expect(mocks.wpRest.mock.calls[0]?.[1].json).toEqual({ description: "<p>X</p>", use_vendor_description: false });
  });

  it("PUT e DELETE expiram imediatamente estoque sem alterar cobertura", async () => {
    await PUT(request({ description: "<p>X</p>" }), context);
    await DELETE(request(), context);
    expect(mocks.revalidateTag.mock.calls).toEqual([
      ["vendor-stock", { expire: 0 }], ["vendor-stock", { expire: 0 }],
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/vendor/estoque");
    expect(mocks.wpRest.mock.calls[0]?.[1].json).toEqual({ description: "<p>X</p>" });
    expect(mocks.wpRest.mock.calls[1]?.[1]).not.toHaveProperty("json");
  });

  it("preserva status de erro e não invalida a lista em falha", async () => {
    mocks.wpRest.mockResolvedValue({ ok: false, status: 500, error: { code: "storage", message: "Falha." } });
    const response = await PUT(request({ description: "X" }), context);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ code: "storage", message: "Falha." });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });
});
