import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

describe("POST /api/profile/identity/cpf", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    wpRestMock.mockReset();
    getServerSessionMock.mockResolvedValue({
      accessToken: "token",
      user: { id: "42" },
    });
  });

  it("requires a valid CPF before contacting WordPress", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/profile/identity/cpf", {
        body: JSON.stringify({
          currentPassword: "senha-atual",
          cpf: "111.111.111-11",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(422);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("forwards the password proof and returns only the CPF suffix", async () => {
    wpRestMock.mockResolvedValue({
      data: { cpfLast4: "5140" },
      ok: true,
      status: 200,
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/profile/identity/cpf", {
        body: JSON.stringify({
          currentPassword: "senha-atual",
          cpf: "037.122.851-40",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cpfLast4: "5140" });
    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/identity/cpf/change",
      {
        headers: { Authorization: "Bearer token" },
        json: { currentPassword: "senha-atual", cpf: "037.122.851-40" },
        method: "POST",
      },
    );
  });
});
