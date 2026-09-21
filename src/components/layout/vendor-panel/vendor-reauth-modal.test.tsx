import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VendorReauthModal } from "./vendor-reauth-modal";

const TICKET = "tiquete-de-teste";
const ACCOUNT_PASSWORD = "senha-da-conta-papelito";
const REAUTH_URL = "/api/vendor/braspress/reauth";

function jsonResponse(data: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    json: () => Promise.resolve(data),
    ok: init.ok ?? true,
    status: init.status ?? 200,
  };
}

function renderModal(props: Partial<Parameters<typeof VendorReauthModal>[0]> = {}) {
  const onClose = vi.fn();
  const onTicket = vi.fn();

  render(
    <VendorReauthModal
      confirmLabel="Confirmar senha"
      description="Confirme sua senha para liberar o formulário."
      onClose={onClose}
      onTicket={onTicket}
      open
      title="Confirme sua senha"
      {...props}
    />,
  );

  return { onClose, onTicket };
}

function typePassword(value = ACCOUNT_PASSWORD) {
  fireEvent.change(screen.getByLabelText(/senha da sua conta papelito/i), { target: { value } });
}

describe("VendorReauthModal", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("entrega ao chamador o tíquete, nunca a senha digitada", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ expiresIn: 300, ticket: TICKET }));
    vi.stubGlobal("fetch", fetchMock);
    const { onTicket } = renderModal();

    typePassword();
    fireEvent.click(screen.getByRole("button", { name: /confirmar senha/i }));

    await waitFor(() => expect(onTicket).toHaveBeenCalledWith(TICKET));
    expect(fetchMock.mock.calls[0]![0]).toBe(REAUTH_URL);
    expect(onTicket.mock.calls[0]![0]).not.toContain(ACCOUNT_PASSWORD);
  });

  it("senha recusada fica no diálogo e não avança", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { code: "papelito_vendor_integration_current_password_invalid" },
          { ok: false, status: 403 },
        ),
      ),
    );
    const { onClose, onTicket } = renderModal();

    typePassword("errada");
    fireEvent.click(screen.getByRole("button", { name: /confirmar senha/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/senha da papelito/i);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onTicket).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("não pergunta ao servidor enquanto o campo estiver vazio", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /confirmar senha/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/digite a senha da sua conta/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("apaga a senha ao fechar, para ela não sobreviver ao diálogo", () => {
    const { onClose } = renderModal();

    typePassword();
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/senha da sua conta papelito/i)).toHaveValue("");
  });

  it("ESC fecha o diálogo, mas não enquanto a ação do chamador está em voo", () => {
    const { onClose } = renderModal({ isSubmitting: true });

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /confirmando/i })).toBeDisabled();

    renderModal();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalledTimes(2);
  });

  it("veste o tom destrutivo sem virar um painel vermelho", () => {
    renderModal({ confirmLabel: "Confirmar remoção", tone: "danger" });

    const confirm = screen.getByRole("button", { name: /confirmar remoção/i });

    expect(confirm).toHaveClass("bg-[#c0392b]");
    expect(screen.getByRole("dialog").querySelector(".bg-\\[\\#c0392b\\]")).toBeInTheDocument();
  });

  it("dá ao diálogo um nome e uma descrição acessíveis", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Confirme sua senha");
    expect(dialog).toHaveAccessibleDescription(/liberar o formulário/i);
  });
});
