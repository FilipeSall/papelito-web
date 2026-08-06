import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConfigContent } from "./config-content";

describe("ConfigContent", () => {
  it("always requires the current password", () => {
    render(<ConfigContent />);

    expect(screen.getByText("Senha atual")).toBeInTheDocument();
    expect(screen.getByText("Nova senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /atualizar senha/i })).toBeInTheDocument();
  });
});
