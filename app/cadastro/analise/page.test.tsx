import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CadastroAnalisePage from "./page";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
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
    expect(screen.getByRole("heading", { name: "Nenhuma candidatura encontrada" })).toBeInTheDocument();
    expect(screen.queryByText(/sua candidatura está em análise/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Etapa 3 de 3")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar cadastro" })).toHaveAttribute(
      "href",
      "/cadastro",
    );
  });

  it("oferece nova tentativa quando a consulta falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    render(<CadastroAnalisePage />);

    expect(await screen.findByText(/não foi possível carregar sua candidatura/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Não foi possível carregar a candidatura" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Etapa 3 de 3")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it.each([
    ["document_required", "Envie seu documento com foto", "Enviar para análise"],
    [
      "pending_manual_review",
      "Sua candidatura está em análise",
      "Recebemos seus dados. Sua conta será criada somente após a aprovação da equipe Papelito.",
    ],
    ["approved", "Cadastro aprovado", "Entrar na conta"],
    ["rejected", "Candidatura encerrada", "Iniciar novo cadastro"],
  ])("preserva a apresentação de %s", async (status, title, action) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status, canUpload: status === "document_required" }), { status: 200 }),
      ),
    );

    render(<CadastroAnalisePage />);

    expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByLabelText("Etapa 3 de 3")).toBeInTheDocument();
    expect(screen.getByText(action)).toBeInTheDocument();
  });
});
