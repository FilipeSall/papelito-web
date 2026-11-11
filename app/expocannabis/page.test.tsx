import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, wpRestMock, notFoundMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  wpRestMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/server/wp-rest", () => ({ wpRest: wpRestMock }));
vi.mock("next/navigation", () => ({ notFound: notFoundMock, redirect: redirectMock }));
vi.mock("@/components/layout/expocannabis-page/expocannabis-app", () => ({
  ExpocannabisApp: () => <div>app do estande</div>,
}));

import ExpocannabisPage from "./page";

describe("ExpocannabisPage", () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({ user: { name: "Operadora" }, accessToken: "token" });
  });

  it("manda para o login sem sessão", async () => {
    getServerSessionMock.mockResolvedValue(null);

    await expect(ExpocannabisPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/entrar?callbackUrl=/expocannabis");
  });

  it("responde 404 quando o WordPress recusa o operador", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 403, error: { code: "papelito_event_forbidden", message: "x" } });

    await expect(ExpocannabisPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("responde 404 quando o WordPress não tem as rotas do evento", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 404, error: { code: "rest_no_route", message: "x" } });

    await expect(ExpocannabisPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("mostra evento não configurado no 503", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 503, error: { code: "papelito_event_not_configured", message: "x" } });

    render(await ExpocannabisPage());

    expect(screen.getByText("Evento ainda não configurado")).toBeInTheDocument();
  });

  it("responde 404 com contexto malformado", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: { lixo: true } });

    await expect(ExpocannabisPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
