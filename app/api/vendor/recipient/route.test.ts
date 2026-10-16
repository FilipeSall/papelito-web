import { beforeEach, describe, expect, it, vi } from "vitest";

const requireVendorAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: (...args: unknown[]) => wpRestMock(...args) }));
vi.mock("../_lib/require-vendor-session", () => ({ requireVendorAccessToken: () => requireVendorAccessTokenMock() }));

describe("POST /api/vendor/recipient", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
  });

  it("envia o cadastro para a Pagar.me pelo WordPress e devolve o estado do recebedor", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: { recipient_id: "re_1", status: "registration", kyc_status: "pending" } });
    const { POST } = await import("./route");

    const response = await POST();

    expect(wpRestMock).toHaveBeenCalledWith("/papelito/v1/vendor/recipient", expect.objectContaining({ method: "POST" }));
    expect(await response.json()).toMatchObject({ recipient_id: "re_1", status: "registration", kyc_status: "pending" });
  });

  it("recusa da Pagar.me mantém o código e o status", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 422, error: { code: "papelito_pagarme_blocked_cnae", message: "x" } });
    const { POST } = await import("./route");
    const response = await POST();

    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("papelito_pagarme_blocked_cnae");
  });

  it("sem sessão de vendor não chama o WordPress", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ error: "Nao autenticado.", status: 401 });
    const { POST } = await import("./route");
    const response = await POST();

    expect(response.status).toBe(401);
    expect(wpRestMock).not.toHaveBeenCalled();
  });
});
