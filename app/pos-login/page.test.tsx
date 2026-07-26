import { describe, expect, it, vi } from "vitest";

import { buildIncompleteB2bSession, buildSession } from "@/../test/factories/session";

const { getServerSessionMock, redirectMock, fetchCompanyContextMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  fetchCompanyContextMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/server/company-api", () => ({ fetchCompanyContext: fetchCompanyContextMock }));

import PostLoginPage from "./page";

function renderPage(searchParams: Record<string, string> = {}) {
  return PostLoginPage({ searchParams: Promise.resolve(searchParams) });
}

async function expectRedirect(promise: Promise<unknown>, target: string) {
  await expect(promise).rejects.toThrow(`NEXT_REDIRECT:${target}`);
}

const INCOMPLETE = { ok: true as const, data: { onboardingStatus: "incomplete", canPurchase: false } };
const COMPLETE = { ok: true as const, data: { onboardingStatus: "complete", canPurchase: true } };

describe("PostLoginPage", () => {
  it("manda cadastro incompleto direto para o onboarding, sem passar pelo catálogo", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildIncompleteB2bSession());
    fetchCompanyContextMock.mockResolvedValueOnce(INCOMPLETE);

    await expectRedirect(renderPage(), "/cadastro/completar?callbackUrl=%2F");
  });

  it("preserva o destino original ao desviar para o onboarding", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildIncompleteB2bSession());
    fetchCompanyContextMock.mockResolvedValueOnce(INCOMPLETE);

    await expectRedirect(
      renderPage({ callbackUrl: "/perfil" }),
      "/cadastro/completar?callbackUrl=%2Fperfil",
    );
  });

  it("manda cadastro completo para a home", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildSession());
    fetchCompanyContextMock.mockResolvedValueOnce(COMPLETE);

    await expectRedirect(renderPage(), "/");
  });

  it("nunca usa /produtos como destino padrão", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildSession());
    fetchCompanyContextMock.mockResolvedValueOnce(COMPLETE);

    await expect(renderPage()).rejects.toThrow();
    expect(redirectMock).not.toHaveBeenCalledWith("/produtos");
  });

  it("respeita um destino explícito quando o cadastro está completo", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildSession());
    fetchCompanyContextMock.mockResolvedValueOnce(COMPLETE);

    await expectRedirect(renderPage({ callbackUrl: "/checkout" }), "/checkout");
  });

  it("manda anônimo para o login", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    await expectRedirect(renderPage(), "/entrar?callbackUrl=%2F");
  });

  it("não aceita callbackUrl externo", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildSession());
    fetchCompanyContextMock.mockResolvedValueOnce(COMPLETE);

    await expectRedirect(renderPage({ callbackUrl: "https://evil.example.com" }), "/");
  });

  it("não redireciona para si mesmo, evitando loop", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildSession());
    fetchCompanyContextMock.mockResolvedValueOnce(COMPLETE);

    await expectRedirect(renderPage({ callbackUrl: "/pos-login" }), "/");
  });
});
