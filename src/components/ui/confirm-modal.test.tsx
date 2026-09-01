import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmModal } from "./confirm-modal";

function renderModal(overrides: Partial<Parameters<typeof ConfirmModal>[0]> = {}) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  render(
    <ConfirmModal
      confirmLabel="Aprovar cadastro"
      description="A empresa passa a comprar pelo marketplace."
      open
      title="Confirmar aprovação"
      onClose={onClose}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );

  return { onClose, onConfirm };
}

describe("ConfirmModal", () => {
  afterEach(cleanup);

  it("não renderiza nada enquanto está fechado", () => {
    renderModal({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("anuncia título e descrição para leitores de tela", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Confirmar aprovação");
    expect(dialog).toHaveAccessibleDescription("A empresa passa a comprar pelo marketplace.");
  });

  it("começa com o foco no cancelar, não na ação destrutiva", () => {
    renderModal();

    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  it("confirma e cancela pelos respectivos botões", () => {
    const { onClose, onConfirm } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Aprovar cadastro" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("trava os dois botões enquanto a decisão está sendo enviada", () => {
    const { onClose, onConfirm } = renderModal({ isSubmitting: true });

    const confirmButton = screen.getByRole("button", { name: "Confirmando..." });
    const cancelButton = screen.getByRole("button", { name: "Cancelar" });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();

    fireEvent.click(confirmButton);
    fireEvent.click(cancelButton);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("fecha com Escape", () => {
    const { onClose } = renderModal();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
