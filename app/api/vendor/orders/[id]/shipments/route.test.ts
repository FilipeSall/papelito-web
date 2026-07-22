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
        data: {
          category: "not_contracted",
          creation_outcome: "not_created",
          manual_fallback_available: true,
          next_reconciliation_at: "",
          reconciliation_attempts: 0,
          reconciliation_status: "not_needed",
          retryable: false,
          support_review_required: false,
        },
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
      creation_outcome: "not_created",
      message: "A API de Pre-Postagem nao esta disponivel para este contrato ou cartao.",
      manual_fallback_available: true,
      next_reconciliation_at: "",
      reconciliation_attempts: 0,
      reconciliation_status: "not_needed",
      retryable: false,
      support_review_required: false,
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
