import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), wpRest: vi.fn() }));
vi.mock("@/lib/server/admin-api-auth", () => ({ getAdminApiSession: mocks.auth }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: mocks.wpRest }));

import { GET } from "./route";

const COUNT_ROUTE_TEST_URL = "http://localhost/api/admin/reports/products/count";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ accessToken: "server-only-token" });
  mocks.wpRest.mockResolvedValue({ ok: true, status: 200, data: { count: 8 } });
});

describe("contagem da exportação de produtos", () => {
  it("repassa situação e categoria e devolve a contagem", async () => {
    const response = await GET(new Request(`${COUNT_ROUTE_TEST_URL}?status=draft&category=sedas`));
    expect(await response.json()).toEqual({ count: 8 });
    expect(mocks.wpRest).toHaveBeenCalledWith("/papelito/v1/admin/reports/products/count?category=sedas&status=draft", {
      headers: { Authorization: "Bearer server-only-token" },
    });
  });

  it("recusa situação ou categoria fora do formato sem chamar o WordPress", async () => {
    for (const query of ["?status=trash", "?category=Sedas%20e%20Filtros", "?category=../x"]) {
      expect((await GET(new Request(`${COUNT_ROUTE_TEST_URL}${query}`))).status).toBe(422);
    }
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });

  it("não conta sem sessão de admin", async () => {
    mocks.auth.mockResolvedValue({ error: "Acesso negado.", status: 403 });
    expect((await GET(new Request(COUNT_ROUTE_TEST_URL))).status).toBe(403);
    expect(mocks.wpRest).not.toHaveBeenCalled();
  });
});
