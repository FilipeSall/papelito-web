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
vi.mock("@/features/profile/server/customer", () => ({
  fetchProfileCustomer: vi.fn().mockResolvedValue({
    meta: { cep: "" },
    billing: { postcode: "", address1: "", address2: "", city: "", state: "" },
    shipping: { postcode: "", address1: "", address2: "", city: "", state: "" },
  }),
}));
vi.mock("./completar-cadastro-form", () => ({
  CompletarCadastroForm: () => null,
}));

import CompletarCadastroPage from "./page";

function renderPage(searchParams: Record<string, string> = {}) {
  return CompletarCadastroPage({ searchParams: Promise.resolve(searchParams) });
}

async function expectRedirect(promise: Promise<unknown>, target: string) {
  await expect(promise).rejects.toThrow(`NEXT_REDIRECT:${target}`);
}

function incompleteContext(onboarding?: Record<string, unknown>) {
  return {
    ok: true as const,
    data: {
      onboardingStatus: "incomplete",
      identityStatus: "incomplete",
      canPurchase: false,
      ...(onboarding ? { onboarding } : {}),
    },
  };
}

describe("CompletarCadastroPage", () => {
  it("manda visitante anônimo para o login", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    await expectRedirect(renderPage(), "/entrar?callbackUrl=%2Fcadastro%2Fcompletar");
  });

  it("devolve quem já concluiu o cadastro para o destino, sem reexibir o onboarding", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildSession());
    fetchCompanyContextMock.mockResolvedValueOnce({
      ok: true,
      data: { onboardingStatus: "complete", canPurchase: true },
    });

    await expectRedirect(renderPage({ callbackUrl: "/perfil" }), "/perfil");
  });

  it("ignora callbackUrl absoluto, evitando open redirect", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildSession());
    fetchCompanyContextMock.mockResolvedValueOnce({
      ok: true,
      data: { onboardingStatus: "complete", canPurchase: true },
    });

    await expectRedirect(renderPage({ callbackUrl: "https://evil.example.com" }), "/");
  });

  it("ignora callbackUrl protocol-relative, evitando open redirect", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildSession());
    fetchCompanyContextMock.mockResolvedValueOnce({
      ok: true,
      data: { onboardingStatus: "complete", canPurchase: true },
    });

    await expectRedirect(renderPage({ callbackUrl: "//evil.example.com" }), "/");
  });

  it("não entra em loop quando o callbackUrl aponta para o próprio onboarding", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildSession());
    fetchCompanyContextMock.mockResolvedValueOnce({
      ok: true,
      data: { onboardingStatus: "complete", canPurchase: true },
    });

    await expectRedirect(renderPage({ callbackUrl: "/cadastro/completar" }), "/");
  });

  it("renderiza o formulário para quem tem cadastro incompleto", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildIncompleteB2bSession());
    fetchCompanyContextMock.mockResolvedValueOnce(incompleteContext());

    await expect(renderPage()).resolves.toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("usa o contexto do WordPress, não o token, como autoridade sobre estar completo", async () => {
    // Token diz "incomplete" (stale), mas o WP já registrou a empresa.
    getServerSessionMock.mockResolvedValueOnce(buildIncompleteB2bSession());
    fetchCompanyContextMock.mockResolvedValueOnce({
      ok: true,
      data: { onboardingStatus: "complete", canPurchase: true },
    });

    await expectRedirect(renderPage({ callbackUrl: "/perfil" }), "/perfil");
  });

  it("mantém o usuário no formulário quando o WordPress está indisponível", async () => {
    getServerSessionMock.mockResolvedValueOnce(buildIncompleteB2bSession());
    fetchCompanyContextMock.mockResolvedValueOnce({ ok: false, status: 503, error: "down" });

    await expect(renderPage()).resolves.toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
