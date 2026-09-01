import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const signInMock = vi.fn();
const clearPreviousSessionBeforeSignInMock = vi.fn();
const routerPushMock = vi.fn();
const routerRefreshMock = vi.fn();

vi.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signInMock(...args) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock, refresh: routerRefreshMock }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/auth/client/logout", () => ({
  clearPreviousSessionBeforeSignIn: () => clearPreviousSessionBeforeSignInMock(),
}));

import { AuthLoginForm } from "./auth-login-form";

describe("AuthLoginForm", () => {
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
});
