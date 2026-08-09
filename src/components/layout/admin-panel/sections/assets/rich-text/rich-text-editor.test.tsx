import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_RICH_TEXT_CONTEXT } from "@/features/rich-text";

import { RichTextEditor } from "./rich-text-editor";

describe("RichTextEditor", () => {
  it("insere o token na posição do cursor após o modal assumir o foco", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <RichTextEditor
        ariaLabel="Mensagem de teste"
        context={EMPTY_RICH_TEXT_CONTEXT}
        id="rich-text-test"
        maxLength={120}
        onChange={onChange}
        promotionProducts={[]}
        value={[{ type: "text", text: "Antes depois" }]}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "Mensagem de teste" });
    await waitFor(() => expect(editor).toHaveTextContent("Antes depois"));

    const range = document.createRange();
    range.setStart(editor.firstChild as Text, 6);
    range.collapse(true);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    const openPicker = screen.getByRole("button", { name: /inserir dado dinâmico/i });
    fireEvent.mouseDown(openPicker);
    await user.click(openPicker);

    const tokenRow = screen.getByText("Frete grátis cupom").closest("li");
    await user.click(within(tokenRow as HTMLElement).getByRole("button", { name: "Inserir" }));

    expect(editor).toHaveTextContent("Antes Frete grátis cupomdepois");
    expect(onChange).toHaveBeenCalled();
  });
});
