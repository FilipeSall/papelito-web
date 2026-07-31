import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserApiSessionMock = vi.fn();

vi.mock("@/lib/server/company-api", () => ({
  getUserApiSession: () => getUserApiSessionMock(),
}));

vi.mock("@/lib/server/env", () => ({
  getWpRestBase: () => "https://wp.test/wp-json/",
}));

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/profile/orders/:id/receipt/email", () => {
  beforeEach(() => {
    getUserApiSessionMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("refuses an unauthenticated request without calling WordPress", async () => {
    getUserApiSessionMock.mockResolvedValue({ error: "Não autenticado.", status: 401 });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/profile/orders/42/receipt/email", { method: "POST" }),
      context("42"),
    );

    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never calls WordPress for a non-numeric order id", async () => {
    getUserApiSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/profile/orders/nope/receipt/email", { method: "POST" }),
      context("nope"),
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("confirms the send", async () => {
    getUserApiSessionMock.mockResolvedValue({ accessToken: "token" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      ),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/profile/orders/42/receipt/email", { method: "POST" }),
      context("42"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("keeps the WordPress reason and status when the send is refused", async () => {
    getUserApiSessionMock.mockResolvedValue({ accessToken: "token" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "papelito_receipt_email_rate_limited",
            message: "Aguarde antes de solicitar outro envio.",
          }),
          { headers: { "Content-Type": "application/json" }, status: 429 },
        ),
      ),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/profile/orders/42/receipt/email", { method: "POST" }),
      context("42"),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      code: "papelito_receipt_email_rate_limited",
    });
  });

  it("turns a network failure into 502", async () => {
    getUserApiSessionMock.mockResolvedValue({ accessToken: "token" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/profile/orders/42/receipt/email", { method: "POST" }),
      context("42"),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      message: "Nao foi possivel enviar o recibo.",
    });
  });
});
