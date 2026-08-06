import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthTextField } from "./auth-text-field";

describe("AuthTextField", () => {
  it("associa dica e erro ao campo sem remover nenhuma das duas informações", () => {
    render(
      <AuthTextField
        error="Informe um e-mail válido."
        hint="Usaremos este endereço para contato."
        id="email"
        label="E-mail"
        name="email"
        placeholder="voce@empresa.com"
        type="email"
      />,
    );

    const field = screen.getByLabelText("E-mail");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAttribute("aria-describedby", "email-hint email-error");
    expect(screen.getByText("Informe um e-mail válido.")).toHaveAttribute("id", "email-error");
  });
});
