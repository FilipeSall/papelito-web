import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInMock = vi.fn();
const clearPreviousSessionBeforeSignInMock = vi.fn();
const routerPushMock = vi.fn();
const routerRefreshMock = vi.fn();

let searchParams = new URLSearchParams();

vi.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signInMock(...args) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock, refresh: routerRefreshMock }),
  useSearchParams: () => searchParams,
}));
vi.mock("@/features/auth/client/logout", () => ({
  clearPreviousSessionBeforeSignIn: () => clearPreviousSessionBeforeSignInMock(),
}));

import { AuthLoginForm } from "./auth-login-form";

describe("AuthLoginForm", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  it("leaves the SPA on success so /pos-login answers with an HTTP redirect", async () => {
    const user = userEvent.setup();
    const assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: assignMock },
    });

    clearPreviousSessionBeforeSignInMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue({
      ok: true,
      error: null,
      url: "http://localhost:3000/pos-login?callbackUrl=%2F",
    });

    render(<AuthLoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "conta@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-correta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("http://localhost:3000/pos-login?callbackUrl=%2F");
    });
    expect(routerPushMock).not.toHaveBeenCalled();
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it("leva para a etapa 3 quem ainda tem candidatura aberta e acertou a senha", async () => {
    const user = userEvent.setup();
    const assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: assignMock },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    clearPreviousSessionBeforeSignInMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });

    render(<AuthLoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "candidata@empresa.test");
    await user.type(screen.getByLabelText("Senha"), "senha-da-candidatura");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/cadastro/analise");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/company-applications/resume",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "candidata@empresa.test",
          password: "senha-da-candidatura",
        }),
      }),
    );
    vi.unstubAllGlobals();
  });

  it("mantém a mensagem genérica quando não há candidatura para retomar", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    clearPreviousSessionBeforeSignInMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });

    render(<AuthLoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "ninguem@empresa.test");
    await user.type(screen.getByLabelText("Senha"), "senha-qualquer");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText(/e-mail ou senha inválidos/i)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("não tenta retomar candidatura quando o erro já tem tratamento próprio", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    clearPreviousSessionBeforeSignInMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue({ error: "papelito_email_not_verified" });

    render(<AuthLoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "pendente@empresa.test");
    await user.type(screen.getByLabelText("Senha"), "senha-correta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Confirme seu e-mail antes de entrar.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("normalizes the email and explains how a Google-created account can recover access", async () => {
    const user = userEvent.setup();
    clearPreviousSessionBeforeSignInMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });

    render(<AuthLoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "  CONTA@EXAMPLE.COM ");
    await user.type(screen.getByLabelText("Senha"), "senha-incorreta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({ username: "conta@example.com" }),
      );
    });
    expect(
      screen.getByText(
        "E-mail ou senha inválidos. Se sua conta foi criada com Google, entre pelo Google ou redefina sua senha.",
      ),
    ).toBeInTheDocument();
  });

  it("ends the login attempt with a recoverable error when identity loading fails", async () => {
    const user = userEvent.setup();
    clearPreviousSessionBeforeSignInMock.mockResolvedValue(undefined);
    signInMock.mockResolvedValue({ error: "papelito_auth_context_unavailable" });

    render(<AuthLoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "conta@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-correta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível concluir seu login agora. Tente novamente."),
      ).toBeInTheDocument();
    });
  });

  it("gives an invited visitor a way to create an account, since this screen cannot", () => {
    searchParams = new URLSearchParams({ callbackUrl: "/convite" });

    render(<AuthLoginForm />);

    expect(
      screen.getByRole("link", { name: "Criar conta para aceitar o convite" }),
    ).toHaveAttribute("href", "/convite/cadastro");
  });

  it("does not advertise the invitation signup outside the invitation flow", () => {
    render(<AuthLoginForm />);

    expect(
      screen.queryByRole("link", { name: "Criar conta para aceitar o convite" }),
    ).not.toBeInTheDocument();
  });
});
