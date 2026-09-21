import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    [
      "pending_email_verification",
      "Confirme seu e-mail",
      "Reenviar link de confirmação",
    ],
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

  it("não oferece o envio de documento enquanto o e-mail não foi confirmado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "pending_email_verification",
            canUpload: false,
            emailVerified: false,
          }),
          { status: 200 },
        ),
      ),
    );

    render(<CadastroAnalisePage />);

    expect(await screen.findByRole("heading", { name: "Confirme seu e-mail" })).toBeInTheDocument();
    expect(screen.queryByText("Enviar para análise")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Documento com foto")).not.toBeInTheDocument();
  });

  it("reenvia o link de confirmação sem dizer se a candidatura existe", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ status: "pending_email_verification", canUpload: false }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<CadastroAnalisePage />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Reenviar link de confirmação" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/company-applications/resend-verification",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(/se ainda faltar confirmar/i);
  });
});
