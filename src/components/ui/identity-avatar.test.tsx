import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IdentityAvatar } from "./identity-avatar";

describe("IdentityAvatar", () => {
  it("usa a inicial do nome da loja quando não há foto", () => {
    render(<IdentityAvatar name="Papeloto" role="seller" />);

    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("usa duas iniciais para nome composto", () => {
    render(<IdentityAvatar name="Ana Compradora" role="customer" />);

    expect(screen.getByText("AC")).toBeInTheDocument();
  });

  it("ignora nomes vazios sem quebrar", () => {
    render(<IdentityAvatar name="   " role="customer" />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("a mesma loja recebe sempre a mesma superfície", () => {
    const { container: primeiro } = render(<IdentityAvatar name="Papeloto" role="seller" />);
    const { container: segundo } = render(<IdentityAvatar name="Papeloto" role="seller" />);

    expect(primeiro.querySelector("span")?.className).toBe(
      segundo.querySelector("span")?.className,
    );
  });

  it("a Papelito usa a marca, não iniciais", () => {
    const { container } = render(<IdentityAvatar name="Suporte" role="administrator" />);

    expect(container.querySelector("img")?.getAttribute("src")).toContain("favicon-96x96");
    expect(screen.queryByText("S")).not.toBeInTheDocument();
  });

  it("cliente e loja nunca renderizam imagem", () => {
    const { container } = render(<IdentityAvatar name="Ana Compradora" role="customer" />);

    expect(container.querySelector("img")).toBeNull();
  });
});
