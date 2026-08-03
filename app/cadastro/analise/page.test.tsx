import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CadastroAnalisePage from "./page";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("CadastroAnalisePage", () => {
  it("orienta a reiniciar o cadastro quando não há cookie de candidatura", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    render(<CadastroAnalisePage />);

    expect(await screen.findByText(/não encontramos uma candidatura/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar cadastro" })).toHaveAttribute(
      "href",
      "/cadastro",
    );
  });

  it("oferece nova tentativa quando a consulta falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    render(<CadastroAnalisePage />);

    expect(await screen.findByText(/não foi possível carregar sua candidatura/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
