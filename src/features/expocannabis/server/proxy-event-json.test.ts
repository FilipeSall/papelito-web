import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserApiSessionMock = vi.fn();
const wpRestMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/lib/server/company-api", () => ({
  getUserApiSession: () => getUserApiSessionMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

vi.mock("@/lib/server/env", () => ({
  getWpRestBase: () => "https://wp.test/wp-json",
}));

const EVENT_PATH = "/papelito/v1/event/expocannabis-2026";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("proxyEventJson", () => {
  beforeEach(() => {
    getUserApiSessionMock.mockReset();
    wpRestMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    getUserApiSessionMock.mockResolvedValue({ accessToken: "operador-token" });
  });

  it("recusa sem sessão com 401 e código do evento", async () => {
    getUserApiSessionMock.mockResolvedValue({ error: "Não autenticado.", status: 401 });
    const { proxyEventJson } = await import("./proxy-event-json");

    const response = await proxyEventJson({ path: "/context", method: "GET" });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "papelito_event_auth_required" });
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("repassa ao evento com o Bearer do operador e sem cache", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: { state: "paid" } });
    const { proxyEventJson } = await import("./proxy-event-json");

    const response = await proxyEventJson({
      path: "/orders",
      method: "POST",
      json: { method: "pix" },
      idempotencyKey: "chk-1",
    });

    expect(wpRestMock).toHaveBeenCalledWith(
      `${EVENT_PATH}/orders`,
      expect.objectContaining({
        method: "POST",
        json: { method: "pix" },
        cache: "no-store",
        headers: { Authorization: "Bearer operador-token", "Idempotency-Key": "chk-1" },
      }),
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({ state: "paid" });
  });

  it("preserva status, código e dados do erro do WordPress", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "papelito_event_quote_changed", message: "mudou", data: { status: 409, quote: { totalCents: 10 } } },
    });
    const { proxyEventJson } = await import("./proxy-event-json");

    const response = await proxyEventJson({ path: "/orders", method: "POST", json: {} });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "papelito_event_quote_changed",
      message: "mudou",
      data: { status: 409, quote: { totalCents: 10 } },
    });
  });

  it("transforma rota inexistente em evento desligado", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 404, error: { code: "rest_no_route", message: "x" } });
    const { proxyEventJson } = await import("./proxy-event-json");

    const response = await proxyEventJson({ path: "/context", method: "GET" });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "papelito_event_disabled" });
  });

  it("falha de rede vira 502", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 0, error: { code: "papelito_network_error", message: "x" } });
    const { proxyEventJson } = await import("./proxy-event-json");

    const response = await proxyEventJson({ path: "/context", method: "GET" });

    expect(response.status).toBe(502);
  });
});

describe("proxyEventDownload", () => {
  beforeEach(() => {
    getUserApiSessionMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    getUserApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
  });

  it("repassa o CSV do repasse como download", async () => {
    fetchMock.mockResolvedValue(
      new Response("pedido;data\n", {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=UTF-8",
          "Content-Disposition": 'attachment; filename="repasse-cifal-expocannabis-2026.csv"',
        },
      }),
    );
    const { proxyEventDownload } = await import("./proxy-event-json");

    const response = await proxyEventDownload("/admin/settlement?format=csv");

    expect(fetchMock).toHaveBeenCalledWith(
      `https://wp.test/wp-json${EVENT_PATH}/admin/settlement?format=csv`,
      expect.objectContaining({ headers: { Authorization: "Bearer admin-token" }, cache: "no-store" }),
    );
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("repasse-cifal");
    expect(await response.text()).toBe("pedido;data\n");
  });

  it("erro do WordPress volta como JSON com o mesmo status", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: "papelito_event_forbidden", message: "x" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const { proxyEventDownload } = await import("./proxy-event-json");

    const response = await proxyEventDownload("/admin/settlement?format=csv");

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "papelito_event_forbidden" });
  });
});

describe("parseEventOrderId", () => {
  it("aceita só dígitos", async () => {
    const { parseEventOrderId } = await import("./proxy-event-json");

    expect(parseEventOrderId("501")).toBe("501");
    expect(parseEventOrderId("../admin")).toBeNull();
    expect(parseEventOrderId("1e3")).toBeNull();
    expect(parseEventOrderId("1234567890123456789")).toBeNull();
  });
});
