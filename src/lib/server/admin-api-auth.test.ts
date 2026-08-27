import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { server } from "../../../test/msw/server";
import { getAdminApiSession, readWithAdminApiSession } from "./admin-api-auth";

const AUTH_ME_URL = "http://localhost:8080/wp-json/papelito/v1/auth/me";

const getServerSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

describe("getAdminApiSession", () => {
  afterEach(() => {
    getServerSessionMock.mockReset();
  });

  it("denies access when the session role is stale admin but WordPress says seller", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "2158" },
      accessToken: "seller-token",
      role: "administrator",
    });

    const result = await getAdminApiSession();

    expect(result).toEqual({ error: "Acesso negado.", status: 403 });
  });

  it("allows access when WordPress confirms the token is administrator", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "486" },
      accessToken: "admin-token",
      role: "customer",
    });

    const result = await getAdminApiSession();

    expect(result).toEqual({ accessToken: "admin-token" });
  });

  it("fails closed when the WordPress identity check fails", async () => {
    server.use(http.get(AUTH_ME_URL, () => new HttpResponse(null, { status: 401 })));
    getServerSessionMock.mockResolvedValue({
      user: { id: "486" },
      accessToken: "admin-token",
      role: "administrator",
    });

    const result = await getAdminApiSession();

    expect(result).toEqual({ error: "Acesso negado.", status: 403 });
  });
});

describe("readWithAdminApiSession", () => {
  afterEach(() => {
    getServerSessionMock.mockReset();
  });

  it("devolve os dados quando o WordPress confirma administrator", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "486" }, accessToken: "admin-token" });

    const result = await readWithAdminApiSession(async (accessToken) => `carregado:${accessToken}`);

    expect(result).toEqual({ data: "carregado:admin-token" });
  });

  it("nao devolve os dados quando o WordPress nega o papel, mesmo com a carga concluida", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "2158" }, accessToken: "seller-token" });
    const load = vi.fn().mockResolvedValue({ segredo: true });

    const result = await readWithAdminApiSession(load);

    expect(result).toEqual({ error: "Acesso negado.", status: 403 });
    expect(result).not.toHaveProperty("data");
  });

  it("falha fechado quando a checagem de identidade do WordPress quebra", async () => {
    server.use(http.get(AUTH_ME_URL, () => new HttpResponse(null, { status: 401 })));
    getServerSessionMock.mockResolvedValue({ user: { id: "486" }, accessToken: "admin-token" });

    const result = await readWithAdminApiSession(async () => "carregado");

    expect(result).toEqual({ error: "Acesso negado.", status: 403 });
  });

  it("nao autentica sem access token e nem chega a disparar a carga", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "486" } });
    const load = vi.fn();

    const result = await readWithAdminApiSession(load);

    expect(result).toEqual({ error: "Não autenticado.", status: 401 });
    expect(load).not.toHaveBeenCalled();
  });

  it("nao deixa rejeicao pendente quando a carga falha e o papel e negado", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "2158" }, accessToken: "seller-token" });

    const result = await readWithAdminApiSession(async () => {
      throw new Error("carga falhou");
    });

    expect(result).toEqual({ error: "Acesso negado.", status: 403 });
  });
});
