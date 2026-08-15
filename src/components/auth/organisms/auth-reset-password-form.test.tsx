import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthResetPasswordForm } from "./auth-reset-password-form";

let searchParamsState: Record<string, string | null> = {
  login: "cliente@papelito.com",
  key: "reset-key",
};

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsState[key] ?? null,
  }),
}));

describe("AuthResetPasswordForm", () => {
  beforeEach(() => {
    searchParamsState = {
      login: "cliente@papelito.com",
      key: "reset-key",
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates password requirements before submitting", async () => {
    const user = userEvent.setup();

    render(<AuthResetPasswordForm />);

    await user.type(screen.getByLabelText("Nova senha"), "1234567");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "7654321");
    await user.click(screen.getByRole("button", { name: /alterar senha/i }));

    expect(
      screen.getByText("A nova senha precisa ter pelo menos 8 caracteres."),
    ).toBeInTheDocument();
    expect(screen.getByText("As senhas precisam coincidir.")).toBeInTheDocument();
  });

  it("shows success and login CTA after a successful reset", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<AuthResetPasswordForm />);

    await user.type(screen.getByLabelText("Nova senha"), "novasenha123");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "novasenha123");
    await user.click(screen.getByRole("button", { name: /alterar senha/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Senha alterada com sucesso. Agora você já pode entrar com a nova senha."),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /ir para entrar/i })).toHaveAttribute(
      "href",
      "/entrar",
    );
  });

  it("shows a friendly error for invalid or expired reset links", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Link de redefinicao expirado. Solicite um novo e-mail para continuar." }),
        {
          status: 410,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(<AuthResetPasswordForm />);

    await user.type(screen.getByLabelText("Nova senha"), "novasenha123");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "novasenha123");
    await user.click(screen.getByRole("button", { name: /alterar senha/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Link de redefinicao expirado. Solicite um novo e-mail para continuar."),
      ).toBeInTheDocument();
    });
  });

  it("blocks submission when the reset link is missing required params", () => {
    searchParamsState = {
      login: null,
      key: null,
    };

    render(<AuthResetPasswordForm />);

    expect(screen.getByText("Link de redefinição inválido ou incompleto.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /alterar senha/i })).toBeDisabled();
  });
});
