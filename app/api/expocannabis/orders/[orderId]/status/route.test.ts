import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyEventJsonMock = vi.fn();

vi.mock("@/features/expocannabis/server/proxy-event-json", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/expocannabis/server/proxy-event-json")>();
  return { ...original, proxyEventJson: (...args: unknown[]) => proxyEventJsonMock(...args) };
});

function context(orderId: string) {
  return { params: Promise.resolve({ orderId }) };
}

describe("GET /api/expocannabis/orders/[orderId]/status", () => {
  beforeEach(() => {
    proxyEventJsonMock.mockReset();
    proxyEventJsonMock.mockResolvedValue(Response.json({ state: "at_terminal" }));
  });

  it("recusa id que não é número com 404 sem chamar o WordPress", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/expocannabis/orders/abc/status"), context("abc"));

    expect(response.status).toBe(404);
    expect(proxyEventJsonMock).not.toHaveBeenCalled();
  });

  it("consulta o status do pedido", async () => {
    const { GET } = await import("./route");

    await GET(new Request("http://localhost/api/expocannabis/orders/501/status"), context("501"));

    expect(proxyEventJsonMock).toHaveBeenCalledWith({ path: "/orders/501/status", method: "GET" });
  });
});
