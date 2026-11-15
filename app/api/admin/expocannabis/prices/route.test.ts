import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminPricesSnapshot } from "@/features/expocannabis/test/admin-prices-fixtures";

const getAdminApiSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

const VALID_BODY = { version: 3, prices: { "11800": 5990 }, kitPctOff: 15 };

function putRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/expocannabis/prices", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/admin/expocannabis/prices", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    wpRestMock.mockReset();
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "token" });
  });

  it("publica no WordPress e devolve a versão nova", async () => {
    const snapshot = adminPricesSnapshot({ version: 4 });
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: snapshot });
    const { PUT } = await import("./route");

    const response = await PUT(putRequest(VALID_BODY));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ snapshot });
    expect(wpRestMock).toHaveBeenCalledWith("/papelito/v1/event/expocannabis-2026/admin/prices", {
      headers: { Authorization: "Bearer token" },
      json: VALID_BODY,
      method: "PUT",
    });
  });

  it("repassa o conflito de versão do WordPress", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 409, error: { code: "papelito_event_prices_conflict", message: "Outra pessoa publicou." } });
    const { PUT } = await import("./route");

    const response = await PUT(putRequest(VALID_BODY));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Outra pessoa publicou." });
  });

  it("responde 502 em JSON quando o WordPress não responde", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 0, error: { code: "network_error", message: "fetch failed" } });
    const { PUT } = await import("./route");

    const response = await PUT(putRequest(VALID_BODY));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: "Não foi possível falar com o WordPress. Tente publicar de novo." });
  });

  it("recusa corpo com preço decimal sem chamar o WordPress", async () => {
    const { PUT } = await import("./route");

    const response = await PUT(putRequest({ ...VALID_BODY, prices: { "11800": 59.9 } }));

    expect(response.status).toBe(400);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("recusa quem não é administrador", async () => {
    getAdminApiSessionMock.mockResolvedValue({ error: "Acesso negado.", status: 403 });
    const { PUT } = await import("./route");

    const response = await PUT(putRequest(VALID_BODY));

    expect(response.status).toBe(403);
    expect(wpRestMock).not.toHaveBeenCalled();
  });
});
