import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), wpRest: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/server/admin-api-auth", () => ({ getAdminApiSession: mocks.auth }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: mocks.wpRest }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { POST } from "./route";

const PRODUCT_IMPORT_ROUTE_TEST_TOKEN = "server-only-token";
const PRODUCT_IMPORT_ROUTE_TEST_PREVIEW = "token-da-previa";

const validBody = { token: PRODUCT_IMPORT_ROUTE_TEST_PREVIEW, createLines: [4], acknowledgeRepeat: false };

function request(body: unknown) {
  return new Request("http://localhost/api/admin/products/import", { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ accessToken: PRODUCT_IMPORT_ROUTE_TEST_TOKEN });
  mocks.wpRest.mockResolvedValue({ ok: true, status: 201, data: { lot: "L-0001", created: [], ignored: [], errors: [] } });
});

describe("proxy da confirmação da importação de produtos", () => {
  it("não chama o WordPress sem sessão de admin", async () => {
    mocks.auth.mockResolvedValue({ error: "Acesso negado.", status: 403 });
    expect((await POST(request(validBody))).status).toBe(403);
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("recusa linhas no corpo, campo desconhecido, token vazio e decisões fora do formato", async () => {
    const bodies = [
      { ...validBody, rows: [{ nome: "Seda" }] },
      { ...validBody, token: "" },
      { ...validBody, token: "x".repeat(81) },
      { ...validBody, createLines: ["4"] },
      { ...validBody, createLines: [0] },
      { ...validBody, createLines: Array.from({ length: 2001 }, (_, index) => index + 1) },
      { ...validBody, acknowledgeRepeat: "sim" },
      [],
    ];
    for (const body of bodies) {
      expect((await POST(request(body))).status).toBe(422);
    }
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("repassa token e decisões com o token do servidor e expira Produtos e Relatórios", async () => {
    const response = await POST(request(validBody));
    expect(response.status).toBe(201);
    expect(mocks.wpRest).toHaveBeenCalledWith("/papelito/v1/admin/products/import", expect.objectContaining({
      method: "POST",
      headers: { Authorization: `Bearer ${PRODUCT_IMPORT_ROUTE_TEST_TOKEN}` },
      json: validBody,
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/relatorios");
  });

  it("devolve o erro do WordPress com o código, sem expirar nada", async () => {
    mocks.wpRest.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "papelito_product_import_repeated_file", message: "Este arquivo já foi importado no lote L-0001." },
    });
    const response = await POST(request(validBody));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: "papelito_product_import_repeated_file", message: "Este arquivo já foi importado no lote L-0001." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
