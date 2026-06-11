import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthForgotPasswordForm } from "./auth-forgot-password-form";

describe("AuthForgotPasswordForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates required and invalid email values before submitting", async () => {
    const user = userEvent.setup();

    render(<AuthForgotPasswordForm />);

    await user.click(screen.getByRole("button", { name: /enviar instrucoes/i }));
    expect(screen.getByText("Informe o e-mail cadastrado para continuar.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("E-mail"), "email-invalido");
    await user.click(screen.getByRole("button", { name: /enviar instrucoes/i }));

    expect(screen.getByText("Informe um e-mail valido.")).toBeInTheDocument();
  });

  it("shows the generic success message after a successful request", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<AuthForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-mail"), "cliente@papelito.com");
    await user.click(screen.getByRole("button", { name: /enviar instrucoes/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Se o e-mail informado estiver cadastrado, voce recebera as instrucoes para redefinir sua senha.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows the backend error message when the request fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Muitas tentativas. Tente novamente." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<AuthForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-mail"), "cliente@papelito.com");
    await user.click(screen.getByRole("button", { name: /enviar instrucoes/i }));

    await waitFor(() => {
      expect(screen.getByText("Muitas tentativas. Tente novamente.")).toBeInTheDocument();
    });
  });
});
