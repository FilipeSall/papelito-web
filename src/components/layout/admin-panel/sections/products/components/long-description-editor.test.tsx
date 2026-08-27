import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { LongDescriptionEditor } from "./long-description-editor";

function ControlledEditor() {
  const [value, setValue] = useState("");

  return <LongDescriptionEditor onChange={setValue} value={value} />;
}

describe("LongDescriptionEditor", () => {
  it("preserva espaços enquanto o usuário digita", async () => {
    const user = userEvent.setup();

    render(<ControlledEditor />);

    const textarea = screen.getByPlaceholderText(
      "Descreva os materiais, diferenciais e detalhes comerciais do produto.",
    );

    await user.type(textarea, "Kit verde especial ");

    expect(textarea).toHaveValue("Kit verde especial ");
  });
});
