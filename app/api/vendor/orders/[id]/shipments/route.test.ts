import { beforeEach, describe, expect, it, vi } from "vitest";

const requireVendorAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("../../../_lib/require-vendor-session", () => ({
  requireVendorAccessToken: () => requireVendorAccessTokenMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

describe("POST /api/vendor/orders/:id/shipments", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
  });

  it("preserves structured provider errors for the vendor UI", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
    wpRestMock.mockResolvedValue({
      error: {
        code: "papelito_correios_service_not_contracted",
        data: { category: "not_contracted", manual_fallback_available: true, retryable: false },
        message: "A API de Pre-Postagem nao esta disponivel para este contrato ou cartao.",
      },
      ok: false,
      status: 404,
    });

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/vendor/orders/11887/shipments"), {
      params: Promise.resolve({ id: "11887" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      category: "not_contracted",
      code: "papelito_correios_service_not_contracted",
      message: "A API de Pre-Postagem nao esta disponivel para este contrato ou cartao.",
      manual_fallback_available: true,
      retryable: false,
    });
  });

  it("never calls WordPress for an invalid order id", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/vendor/orders/nope/shipments"), {
      params: Promise.resolve({ id: "nope" }),
    });

    expect(response.status).toBe(400);
    expect(wpRestMock).not.toHaveBeenCalled();
  });
});
