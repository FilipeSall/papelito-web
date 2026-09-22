import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminApiSessionMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

import { DELETE, PUT } from "./route";

const VENDOR_ID = "2334";
const WP_PATH = "/papelito/v1/admin/vendors/2334/integrations/braspress";
const ROUTE_URL = "http://localhost/api/admin/vendors/2334/integrations/braspress";
const BRASPRESS_SECRET = "senha-do-contrato-da-loja";

function params(id = VENDOR_ID) {
  return { params: Promise.resolve({ id }) };
}

function putRequest(body: Record<string, unknown>) {
  return new Request(ROUTE_URL, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
}

describe("rota administrativa da integração Braspress", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    wpRestMock.mockReset();
  });

  it("encaminha a credencial ao WordPress sem interpretá-la", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({
      data: { credentials_configured: true, enabled: true, provider: "braspress", status: "ready" },
      ok: true,
      status: 200,
    });

    const response = await PUT(
      putRequest({
        enabled: true,
        originCep: "14700000",
        password: BRASPRESS_SECRET,
        username: "usuario-do-contrato",
      }),
      params(),
    );

    expect(wpRestMock).toHaveBeenCalledWith(WP_PATH, {
      headers: { Authorization: "Bearer admin-token" },
      json: {
        enabled: true,
        originCep: "14700000",
        password: BRASPRESS_SECRET,
        username: "usuario-do-contrato",
      },
      method: "PUT",
    });
    expect(response.status).toBe(200);
  });

  it("encaminha a remoção sem corpo", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({ data: { provider: "braspress" }, ok: true, status: 200 });

    const response = await DELETE(new Request(ROUTE_URL, { method: "DELETE" }), params());

    expect(wpRestMock).toHaveBeenCalledWith(WP_PATH, {
      headers: { Authorization: "Bearer admin-token" },
      json: undefined,
      method: "DELETE",
    });
    expect(response.status).toBe(200);
  });

  it.each([
    [401, "Não autenticado."],
    [403, "Acesso negado."],
  ])("recusa com %i quem não é administrador", async (status, error) => {
    getAdminApiSessionMock.mockResolvedValue({ error, status });

    const response = await PUT(putRequest({ enabled: false }), params());

    expect(response.status).toBe(status);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("não chama o WordPress quando o id da rota não é um vendor válido", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });

    const response = await PUT(putRequest({ enabled: false }), params("abc"));

    expect(response.status).toBe(400);
    expect(wpRestMock).not.toHaveBeenCalled();
  });

  it("preserva o status e o código que o WordPress devolveu", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({
      error: {
        code: "papelito_vendor_integration_profile_incomplete",
        message: "Informe o CEP de origem.",
      },
      ok: false,
      status: 422,
    });

    const response = await PUT(putRequest({ enabled: true }), params());

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      code: "papelito_vendor_integration_profile_incomplete",
      message: "Informe o CEP de origem.",
    });
  });

  it("responde 502 quando a falha não traz status do backend", async () => {
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "admin-token" });
    wpRestMock.mockResolvedValue({
      error: { code: undefined, message: "Falha de rede." },
      ok: false,
      status: 0,
    });

    const response = await DELETE(new Request(ROUTE_URL, { method: "DELETE" }), params());

    expect(response.status).toBe(502);
  });
});
