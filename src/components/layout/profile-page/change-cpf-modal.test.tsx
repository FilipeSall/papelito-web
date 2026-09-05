import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChangeCpfModal } from "./change-cpf-modal";

describe("ChangeCpfModal", () => {
  it("requires a valid CPF before submitting the password proof", () => {
    const onSubmit = vi.fn();

    render(<ChangeCpfModal onClose={vi.fn()} onSubmit={onSubmit} open />);

    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "senha-atual" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar CPF" }));

    expect(screen.getByText(/Informe um CPF válido\./)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the current password and formatted CPF", () => {
    const onSubmit = vi.fn();

    render(<ChangeCpfModal onClose={vi.fn()} onSubmit={onSubmit} open />);

    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "senha-atual" },
    });
    fireEvent.change(screen.getByLabelText("Novo CPF"), {
      target: { value: "03712285140" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar CPF" }));

    expect(onSubmit).toHaveBeenCalledWith("senha-atual", "037.122.851-40");
  });
});
