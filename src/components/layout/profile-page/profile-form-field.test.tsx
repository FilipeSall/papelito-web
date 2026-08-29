import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProfileFormField } from "./profile-form-field";

describe("ProfileFormField — revelar senha", () => {
  it("começa mascarado e oferece o botão de mostrar", () => {
    const { container } = render(
      <ProfileFormField label="Senha atual" type="password" value="segredo" />,
    );

    expect(container.querySelector("input")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeInTheDocument();
  });

  it("revela e volta a ocultar a senha", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProfileFormField label="Senha atual" type="password" value="segredo" />,
    );

    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(container.querySelector("input")).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(container.querySelector("input")).toHaveAttribute("type", "password");
  });

  it("não submete o formulário ao alternar", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ProfileFormField label="Senha atual" type="password" value="segredo" />
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("não mostra o botão em campo que não é senha", () => {
    render(<ProfileFormField label="Nome" value="Fulano" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("mantém o campo desabilitado sem alternância", () => {
    render(
      <ProfileFormField disabled label="Senha atual" type="password" value="segredo" />,
    );

    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeDisabled();
  });
});
