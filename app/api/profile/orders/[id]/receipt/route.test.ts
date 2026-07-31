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

describe("GET /api/profile/orders/:id/receipt", () => {
  beforeEach(() => {
    getUserApiSessionMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("refuses an unauthenticated request without calling WordPress", async () => {
    getUserApiSessionMock.mockResolvedValue({ error: "Não autenticado.", status: 401 });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/profile/orders/42/receipt"), context("42"));

    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never calls WordPress for a non-numeric order id", async () => {
    getUserApiSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/profile/orders/nope/receipt"),
      context("nope"),
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("streams the PDF preserving the WordPress headers", async () => {
    getUserApiSessionMock.mockResolvedValue({ accessToken: "token" });
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("%PDF-1.4"));
        controller.close();
      },
    });
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(body, {
        headers: {
          "Content-Disposition": 'attachment; filename="recibo-pedido-42.pdf"',
          "Content-Type": "application/pdf",
        },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/profile/orders/42/receipt"), context("42"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="recibo-pedido-42.pdf"',
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(await response.text()).toBe("%PDF-1.4");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://wp.test/wp-json/papelito/v1/profile/me/orders/42/receipt",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("passes the WordPress refusal through with its own status", async () => {
    getUserApiSessionMock.mockResolvedValue({ accessToken: "token" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "papelito_receipt_payment_not_confirmed" }), {
          headers: { "Content-Type": "application/json" },
          status: 409,
        }),
      ),
    );

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/profile/orders/42/receipt"), context("42"));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "papelito_receipt_payment_not_confirmed",
    });
  });

  it("turns a network failure into 502", async () => {
    getUserApiSessionMock.mockResolvedValue({ accessToken: "token" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/profile/orders/42/receipt"), context("42"));

    expect(response.status).toBe(502);
  });
});
