import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminApiSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: (...args: unknown[]) => getAdminApiSessionMock(...args),
  readWithAdminApiSession: vi.fn(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

function putPhone() {
  return new Request("http://localhost/api/admin/contact-config", {
    body: JSON.stringify({ phone: "+556133334444" }),
    method: "PUT",
  });
}

describe("PUT /api/admin/contact-config", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    wpRestMock.mockReset();
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "token" });
  });

  it.each([
    [401, "Sessão expirada."],
    [403, "Sem permissão."],
    [422, "Telefone inválido."],
  ])("preserva o status %i que o WordPress devolveu", async (status, message) => {
    wpRestMock.mockResolvedValue({ ok: false, status, error: new Error(message) });

    const { PUT } = await import("./route");
    const response = await PUT(putPhone());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ message });
  });

  it("mantém 502 quando a falha não traz status do backend", async () => {
    wpRestMock.mockRejectedValue(new Error("socket hang up"));

    const { PUT } = await import("./route");
    const response = await PUT(putPhone());

    expect(response.status).toBe(502);
  });

  it("responde 200 com a configuração normalizada no sucesso", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { phone: "+556133334444", social: {} },
    });

    const { PUT } = await import("./route");
    const response = await PUT(putPhone());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ phone: "+556133334444" });
  });
});
