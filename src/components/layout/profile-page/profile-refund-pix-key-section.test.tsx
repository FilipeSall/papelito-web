import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileRefundPixKeySection } from "./profile-refund-pix-key-section";

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("ProfileRefundPixKeySection", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("mostra só a pista da chave cadastrada", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        pixKey: { holderName: "Maria da Silva", hint: "****4725", type: "cpf", updatedAt: "2026-09-14 12:00:00" },
      }),
    );

    render(<ProfileRefundPixKeySection />);

    expect(await screen.findByText("****4725")).toBeInTheDocument();
    expect(screen.getByText(/titular: maria da silva/i)).toBeInTheDocument();
  });

  it("cadastra a chave e troca o formulário pela pista devolvida", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { pixKey: null })).mockResolvedValueOnce(
      jsonResponse(200, {
        pixKey: { holderName: "Maria da Silva", hint: "m***@exemplo.com.br", type: "email", updatedAt: "2026-09-14 12:00:00" },
      }),
    );
    const user = userEvent.setup();

    render(<ProfileRefundPixKeySection />);

    await user.click(await screen.findByRole("button", { name: /cadastrar chave pix/i }));
    await user.click(screen.getByRole("button", { name: "E-mail" }));
    await user.type(screen.getByLabelText(/chave pix/i), "maria@exemplo.com.br");
    await user.type(screen.getByLabelText(/nome do titular/i), "Maria da Silva");
    await user.click(screen.getByRole("button", { name: /salvar chave pix/i }));

    expect(await screen.findByText("m***@exemplo.com.br")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/profile/refund-pix-key", expect.objectContaining({ method: "PUT" }));
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toEqual({
      holderName: "Maria da Silva",
      key: "maria@exemplo.com.br",
      type: "email",
    });
  });

  it("mostra o erro do backend sem perder o que foi digitado", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { pixKey: null }))
      .mockResolvedValueOnce(jsonResponse(422, { message: "Chave PIX inválida para o tipo escolhido." }));
    const user = userEvent.setup();

    render(<ProfileRefundPixKeySection />);

    await user.click(await screen.findByRole("button", { name: /cadastrar chave pix/i }));
    await user.type(screen.getByLabelText(/chave pix/i), "123");
    await user.type(screen.getByLabelText(/nome do titular/i), "Maria da Silva");
    await user.click(screen.getByRole("button", { name: /salvar chave pix/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Chave PIX inválida para o tipo escolhido.");
    expect(screen.getByLabelText(/chave pix/i)).toHaveValue("123");
  });

  it("não afirma que não há chave quando a leitura falha", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { message: "erro" }));

    render(<ProfileRefundPixKeySection />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível carregar/i);
    expect(screen.queryByRole("button", { name: /cadastrar chave pix/i })).not.toBeInTheDocument();
  });
});
