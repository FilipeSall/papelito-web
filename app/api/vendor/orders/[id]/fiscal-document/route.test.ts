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

function post(body: unknown) {
  return new Request("http://localhost/api/vendor/orders/14094/fiscal-document", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

const params = Promise.resolve({ id: "14094" });

function declaredSentToWordPress() {
  return (wpRestMock.mock.calls[0][1] as { json: Record<string, unknown> }).json;
}

describe("POST /api/vendor/orders/[id]/fiscal-document", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
    wpRestMock.mockResolvedValue({ ok: true, data: { can_attach: true, enabled: true } });
  });

  it("recusa o pedido não autenticado sem falar com o WordPress", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ error: "Não autenticado.", status: 401 });

    const { POST } = await import("./route");
    const response = await POST(post({ accessKey: "1" }), { params });

    expect(response.status).toBe(401);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("recusa id de pedido não numérico", async () => {
    const { POST } = await import("./route");
    const response = await POST(post({ accessKey: "1" }), {
      params: Promise.resolve({ id: "14094; DROP" }),
    });

    expect(response.status).toBe(400);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("repassa campo vazio para o vendor poder apagar um dado errado (regressão)", async () => {
    const { POST } = await import("./route");
    await POST(post({ docNumber: "777", docSeries: "" }), { params });

    expect(declaredSentToWordPress()).toEqual({ docNumber: "777", docSeries: "" });
  });

  it("repassa totalCents zero como pedido de limpeza", async () => {
    const { POST } = await import("./route");
    await POST(post({ totalCents: 0 }), { params });

    expect(declaredSentToWordPress()).toEqual({ totalCents: 0 });
  });

  it("ignora campo que o WordPress não conhece", async () => {
    const { POST } = await import("./route");
    await POST(post({ accessKey: "  53250  ", isCurrent: 0, validationLevel: 5 }), { params });

    expect(declaredSentToWordPress()).toEqual({ accessKey: "53250" });
  });

  it("recusa corpo sem nenhum campo conhecido", async () => {
    const { POST } = await import("./route");
    const response = await POST(post({ validationLevel: 5 }), { params });

    expect(response.status).toBe(422);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("propaga o código e o status da recusa do WordPress", async () => {
    wpRestMock.mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "papelito_fiscal_order_not_ready", message: "Pedido cancelado não recebe nota fiscal." },
    });

    const { POST } = await import("./route");
    const response = await POST(post({ accessKey: "53250" }), { params });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "papelito_fiscal_order_not_ready",
      message: "Pedido cancelado não recebe nota fiscal.",
    });
  });
});
