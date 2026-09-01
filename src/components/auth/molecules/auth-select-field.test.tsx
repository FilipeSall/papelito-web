import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthSelectField } from "./auth-select-field";

const options = [
  { label: "DF — Distrito Federal", searchText: "DF Distrito Federal", triggerLabel: "DF", value: "DF" },
  { label: "SP — São Paulo", searchText: "SP São Paulo", triggerLabel: "SP", value: "SP" },
];

function renderField(value = "", onChange = vi.fn()) {
  render(
    <form data-testid="form">
      <AuthSelectField
        label="Estado"
        name="state"
        options={options}
        placeholder="UF"
        value={value}
        onChange={onChange}
      />
    </form>,
  );

  return onChange;
}

describe("AuthSelectField", () => {
  afterEach(cleanup);

  it("envia o valor escolhido pelo FormData, mesmo sem <select> nativo", () => {
    renderField("DF");

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("state")).toBe("DF");
  });

  it("mostra o placeholder enquanto nada foi escolhido", () => {
    renderField();

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("state")).toBe("");
    expect(screen.getByRole("button", { name: "UF" })).toBeInTheDocument();
  });

  it("devolve o valor da opção escolhida no menu", () => {
    const onChange = renderField();

    fireEvent.click(screen.getByRole("button", { name: "UF" }));
    fireEvent.click(screen.getByRole("button", { name: "SP — São Paulo" }));

    expect(onChange).toHaveBeenCalledWith("SP");
  });
});
