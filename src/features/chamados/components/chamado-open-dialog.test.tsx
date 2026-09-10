import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHAMADO_ABERTO_ID, CHAMADO_ORDER_ID } from "../../../../test/factories/chamado";

import { ChamadoOpenDialog } from "./chamado-open-dialog";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

function open() {
  return render(
    <ChamadoOpenDialog orderId={CHAMADO_ORDER_ID} role="customer" triggerClassName="botao" />,
  );
}

function write(text: string) {
  const composer = screen.getByRole("textbox", { name: "Mensagem" });
  composer.textContent = text;
  composer.dispatchEvent(new Event("input", { bubbles: true }));
  return composer;
}

describe("ChamadoOpenDialog", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
  });

  it("abre chamado que não é devolução, com o motivo escolhido", async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole("button", { name: "Abrir chamado" }));
    await user.click(await screen.findByRole("radio", { name: "Dúvida sobre o pedido" }));

    write("A nota fiscal não veio.");
    // Dois botões com o mesmo nome: o gatilho e a confirmação. O último é o de dentro do modal.
    await user.click(screen.getAllByRole("button", { name: "Abrir chamado" }).at(-1)!);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/perfil/chamados/77"));
  });

  it("não deixa abrir sem escolher assunto", async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole("button", { name: "Abrir chamado" }));
    await screen.findByRole("radio", { name: "Dúvida sobre o pedido" });

    write("Sem assunto escolhido");

    const acoes = screen.getAllByRole("button", { name: "Abrir chamado" });
    expect(acoes[acoes.length - 1]).toBeDisabled();
    expect(push).not.toHaveBeenCalled();
  });

  it("devolução exige também o motivo da devolução", async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole("button", { name: "Abrir chamado" }));
    await user.click(await screen.findByRole("radio", { name: "Solicitação de devolução" }));

    write("Quero devolver");
    const antes = screen.getAllByRole("button", { name: "Abrir chamado" });
    expect(antes[antes.length - 1]).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Produto com defeito" }));
    write("Quero devolver");

    const depois = screen.getAllByRole("button", { name: "Abrir chamado" });
    expect(depois[depois.length - 1]).toBeEnabled();
  });

  it("chamado já aberto com o mesmo motivo leva ao que existe, em vez de repetir a recusa", async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole("button", { name: "Abrir chamado" }));
    await user.click(await screen.findByRole("radio", { name: "Atraso na entrega" }));

    write("De novo");
    await user.click(screen.getAllByRole("button", { name: "Abrir chamado" }).at(-1)!);

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/perfil/chamados/${CHAMADO_ABERTO_ID}`),
    );
  });
})
