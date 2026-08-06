import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordSettingsCard } from "./password-settings-card";

describe("PasswordSettingsCard", () => {
  it("always requires the current password", () => {
    render(<PasswordSettingsCard />);

    expect(screen.getByText("Senha atual")).toBeInTheDocument();
    expect(screen.getByText("Nova senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /atualizar senha/i })).toBeInTheDocument();
  });
});
