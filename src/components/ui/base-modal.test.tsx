import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { BaseModal } from "./base-modal";

describe("BaseModal", () => {
  it("renders through a portal and locks body scroll while open", async () => {
    const onClose = vi.fn();
    const { container, rerender } = render(
      <BaseModal
        ariaLabelledBy="test-modal-title"
        onClose={onClose}
        open
      >
        <div>
          <h2 id="test-modal-title">Modal aberto</h2>
        </div>
      </BaseModal>,
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <BaseModal
        ariaLabelledBy="test-modal-title"
        onClose={onClose}
        open={false}
      >
        <div>
          <h2 id="test-modal-title">Modal aberto</h2>
        </div>
      </BaseModal>,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and overlay click", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <BaseModal
        ariaLabelledBy="test-modal-title"
        onClose={onClose}
        open
      >
        <div>
          <h2 id="test-modal-title">Modal aberto</h2>
        </div>
      </BaseModal>,
    );

    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("base-modal-overlay"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("BaseModal focus management", () => {
  it("uses the supplied initial focus target", () => {
    const FocusTarget = () => {
      const ref = { current: null as HTMLInputElement | null };
      return (
        <BaseModal ariaLabelledBy="t" initialFocusRef={ref} onClose={() => {}} open>
          <h2 id="t">Title</h2>
          <input ref={ref} aria-label="Busca" />
          <button type="button">Inside</button>
        </BaseModal>
      );
    };

    render(<FocusTarget />);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Busca" }));
  });

  it("moves focus into the dialog on open", () => {
    render(
      <BaseModal ariaLabelledBy="t" onClose={() => {}} open>
        <h2 id="t">Title</h2>
        <button type="button">Inside</button>
      </BaseModal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("returns focus to the previously focused element on close", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <BaseModal ariaLabelledBy="t" onClose={() => {}} open>
        <h2 id="t">Title</h2>
        <button type="button">Inside</button>
      </BaseModal>,
    );
    rerender(
      <BaseModal ariaLabelledBy="t" onClose={() => {}} open={false}>
        <h2 id="t">Title</h2>
        <button type="button">Inside</button>
      </BaseModal>,
    );
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(
      <BaseModal ariaLabelledBy="t" onClose={onClose} open>
        <h2 id="t">Title</h2>
      </BaseModal>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("BaseModal — foco durante a digitação", () => {
  function Harness() {
    const [valor, setValor] = useState("");

    return (
      <BaseModal
        ariaLabelledBy="titulo"
        onClose={() => setValor("")}
        open
      >
        <h2 id="titulo">Formulário</h2>
        <button onClick={() => setValor("")} type="button">
          Fechar
        </button>
        <input
          aria-label="nome"
          onChange={(event) => setValor(event.target.value)}
          value={valor}
        />
      </BaseModal>
    );
  }

  it("não rouba o foco do campo quando o onClose muda de identidade a cada render", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("nome"), "Fulano");

    expect(screen.getByLabelText("nome")).toHaveValue("Fulano");
  });
});
