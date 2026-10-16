import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), wpRest: vi.fn(), revalidateTag: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock("../../../_lib/require-vendor-session", () => ({ requireVendorAccessToken: mocks.auth }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: mocks.wpRest }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag, revalidatePath: mocks.revalidatePath }));

import { POST } from "./route";

const IMPORT_ROUTE_TEST_TOKEN = "server-only-token";
const IMPORT_ROUTE_TEST_PATH = "/papelito/v1/vendor/me/products/vendor-codes/import";

const validRow = {
  line: 2,
  description: "SEDA PAPELITO BROWN KING SIZE",
  subgroup: "HEADSHOP - SEDA PAPELITO",
  code: "00585",
  family_id: 11768,
  expected: [{ product_id: 11768, current_code: null }],
};

function request(body: unknown) {
  return new Request("http://localhost/api/vendor/stock/vendor-codes/import", { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ accessToken: IMPORT_ROUTE_TEST_TOKEN });
  mocks.wpRest.mockResolvedValue({ ok: true, status: 200, data: { batch_id: "b", summary: { updated_items: 1 }, rows: [] } });
});

describe("proxy da confirmação de importação de SKUs", () => {
  it("não chama o WordPress sem sessão de vendor", async () => {
    mocks.auth.mockResolvedValue({ error: "Não autenticado.", status: 401 });
    expect((await POST(request({ rows: [validRow] }))).status).toBe(401);
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("recusa identidade, campo desconhecido, código numérico e lote vazio ou grande demais", async () => {
    const bodies = [
      { rows: [] },
      { rows: [validRow], vendor_id: 9 },
      { rows: [{ ...validRow, vendor_id: 9 }] },
      { rows: [{ ...validRow, code: 585 }] },
      { rows: [{ ...validRow, family_id: 0 }] },
      { rows: [{ ...validRow, expected: [{ product_id: "11768", current_code: null }] }] },
      { rows: Array.from({ length: 2001 }, () => validRow) },
      [],
    ];
    for (const body of bodies) {
      expect((await POST(request(body))).status).toBe(422);
    }
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("repassa as linhas com o token do servidor e expira a listagem de estoque", async () => {
    const response = await POST(request({ rows: [validRow] }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.wpRest).toHaveBeenCalledWith(IMPORT_ROUTE_TEST_PATH, {
      method: "POST",
      headers: { Authorization: "Bearer " + IMPORT_ROUTE_TEST_TOKEN },
      json: { rows: [validRow] },
      timeoutMs: 60_000,
    });
    expect(mocks.revalidateTag.mock.calls).toEqual([["vendor-stock", { expire: 0 }]]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/vendor/estoque");
  });

  it("falha de gravação mantém o status do WordPress e não expira cache", async () => {
    mocks.wpRest.mockResolvedValue({
      ok: false, status: 500,
      error: { code: "papelito_vendor_code_import_storage_error", message: "Não foi possível gravar os códigos. Nenhuma alteração foi salva." },
    });
    const response = await POST(request({ rows: [validRow] }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      code: "papelito_vendor_code_import_storage_error",
      message: "Não foi possível gravar os códigos. Nenhuma alteração foi salva.",
    });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });
});
