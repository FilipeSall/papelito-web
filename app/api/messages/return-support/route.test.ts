import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMessageAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("../_lib/require-message-session", () => ({
  requireMessageAccessToken: () => requireMessageAccessTokenMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

describe("POST /api/messages/return-support", () => {
  beforeEach(() => {
    requireMessageAccessTokenMock.mockReset();
    wpRestMock.mockReset();
  });

  it("opens the server-generated return support thread for the authenticated customer", async () => {
    requireMessageAccessTokenMock.mockResolvedValue({ accessToken: "customer-token" });
    wpRestMock.mockResolvedValue({ data: { thread_id: 91 }, ok: true, status: 201 });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/messages/return-support", {
        body: JSON.stringify({ orderId: 14094, reason: "defective", reasonOther: "" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/messages/orders/14094/return-support",
      expect.objectContaining({
        headers: { Authorization: "Bearer customer-token" },
        json: { reason: "defective", reasonOther: "" },
        method: "POST",
      }),
    );
  });

  it("recusa devolução sem motivo antes de falar com o WordPress", async () => {
    requireMessageAccessTokenMock.mockResolvedValue({ accessToken: "customer-token" });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/messages/return-support", {
        body: JSON.stringify({ orderId: 14094 }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: "papelito_return_reason_invalid" });
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid order before contacting WordPress", async () => {
    requireMessageAccessTokenMock.mockResolvedValue({ accessToken: "customer-token" });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/messages/return-support", {
        body: JSON.stringify({ orderId: "x", reason: "defective" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(422);
    expect(wpRestMock).not.toHaveBeenCalled();
  });
});
