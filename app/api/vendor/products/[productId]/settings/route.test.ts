import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), read: vi.fn(), wpRest: vi.fn(), revalidateTag: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock("../../../_lib/require-vendor-session", () => ({ requireVendorAccessToken: mocks.auth, readWithVendorAccessToken: mocks.read }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: mocks.wpRest }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag, revalidatePath: mocks.revalidatePath }));

import * as route from "./route";

const { GET, PATCH } = route;
const SETTINGS_TEST_TOKEN = "server-only-token";
const SETTINGS_TEST_PATH = "/papelito/v1/vendor/me/products/123/settings";

const context = { params: Promise.resolve({ productId: "123" }) };
function request(body?: unknown) {
  return new Request("http://localhost/api/vendor/products/123/settings", {
    method: body === undefined ? "GET" : "PATCH",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ accessToken: SETTINGS_TEST_TOKEN });
  mocks.read.mockImplementation(async (load: (token: string) => Promise<unknown>) => ({ data: await load(SETTINGS_TEST_TOKEN) }));
  mocks.wpRest.mockResolvedValue({ ok: true, data: { product_id: 123, vendor_code: "000419", updated_at: null } });
});

describe("proxy do código do vendor", () => {
  it("não chama o WordPress sem sessão autorizada", async () => {
    mocks.auth.mockResolvedValue({ error: "Não autenticado.", status: 401 });
    expect((await PATCH(request({ vendor_code: "X" }), context)).status).toBe(401);
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("recusa identidade, campo desconhecido e tipo errado no corpo", async () => {
    for (const body of [{ vendor_code: "X", vendor_id: 2 }, { sku: "X" }, {}, { vendor_code: 419 }, { vendor_code: "x".repeat(241) }, []]) {
      expect((await PATCH(request(body), context)).status).toBe(422);
    }
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("PATCH repassa o código e expira a listagem de estoque", async () => {
    const response = await PATCH(request({ vendor_code: "000419" }), context);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.wpRest).toHaveBeenCalledWith(SETTINGS_TEST_PATH, {
      method: "PATCH", headers: { Authorization: "Bearer " + SETTINGS_TEST_TOKEN }, json: { vendor_code: "000419" },
    });
    expect(mocks.revalidateTag.mock.calls).toEqual([["vendor-stock", { expire: 0 }]]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/vendor/estoque");
  });

  it("PATCH com null remove o código", async () => {
    await PATCH(request({ vendor_code: null }), context);
    expect(mocks.wpRest.mock.calls[0]?.[1].json).toEqual({ vendor_code: null });
  });

  it("erro do WordPress não invalida cache e mantém o status", async () => {
    mocks.wpRest.mockResolvedValue({ ok: false, status: 422, error: { message: "O código deve ter no máximo 60 caracteres.", code: "papelito_item_settings_invalid" } });
    const response = await PATCH(request({ vendor_code: "X" }), context);
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ message: "O código deve ter no máximo 60 caracteres.", code: "papelito_item_settings_invalid" });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("GET é privado e não invalida nada", async () => {
    await GET(request(), context);
    expect(mocks.wpRest).toHaveBeenCalledWith(SETTINGS_TEST_PATH, {
      method: "GET", headers: { Authorization: "Bearer " + SETTINGS_TEST_TOKEN },
    });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("recusa produto inválido antes de consultar sessão ou WordPress", async () => {
    const response = await GET(request(), { params: Promise.resolve({ productId: "0" }) });
    expect(response.status).toBe(400);
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("não expõe PUT nem DELETE", () => {
    expect(route).not.toHaveProperty("PUT");
    expect(route).not.toHaveProperty("DELETE");
  });
});
