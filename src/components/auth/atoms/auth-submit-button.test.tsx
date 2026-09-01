import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AuthSubmitButton } from "./auth-submit-button";

describe("AuthSubmitButton", () => {
  afterEach(cleanup);

  it("mostra o rótulo e o ícone quando não está carregando", () => {
    render(
      <AuthSubmitButton icon={<span data-testid="icone" />}>Próximo</AuthSubmitButton>,
    );

    const button = screen.getByRole("button", { name: /próximo/i });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("aria-busy", "false");
    expect(screen.getByTestId("icone")).toBeInTheDocument();
  });

  it("troca o ícone pelo spinner e bloqueia o clique enquanto carrega", () => {
    render(
      <AuthSubmitButton icon={<span data-testid="icone" />} loading loadingLabel="Carregando">
        Próximo
      </AuthSubmitButton>,
    );

    const button = screen.getByRole("button", { name: /carregando/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByTestId("icone")).not.toBeInTheDocument();
    expect(button.querySelector(".animate-spin")).not.toBeNull();
  });

  it("mantém o rótulo original quando não há loadingLabel", () => {
    render(<AuthSubmitButton loading>Enviar candidatura</AuthSubmitButton>);

    expect(screen.getByRole("button", { name: /enviar candidatura/i })).toBeDisabled();
  });
});
