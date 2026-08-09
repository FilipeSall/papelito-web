import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InstallmentSettings } from "./installment-settings";

describe("InstallmentSettings", () => {
  afterEach(() => vi.restoreAllMocks());

  it("salva a configuração válida de parcelamento", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ installmentMinimumCents: 250, maxInstallments: 8 }), { status: 200 }),
    );

    render(
      <InstallmentSettings
        initialConfig={{ installmentMinimumCents: 100, maxInstallments: 6 }}
        onSaved={onSaved}
      />,
    );

    await user.clear(screen.getByLabelText("Máximo de parcelas"));
    await user.type(screen.getByLabelText("Máximo de parcelas"), "8");
    await user.clear(screen.getByLabelText("Valor mínimo da parcela"));
    await user.type(screen.getByLabelText("Valor mínimo da parcela"), "2,50");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/payment-config", {
      body: JSON.stringify({ maxInstallments: 8, installmentMinimumCents: 250 }),
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      method: "PUT",
    });
    expect(onSaved).toHaveBeenCalledWith({ installmentMinimumCents: 250, maxInstallments: 8 });
  });

  it("rejeita valores inválidos antes da chamada", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<InstallmentSettings initialConfig={null} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText("Máximo de parcelas"), "0");
    await user.type(screen.getByLabelText("Valor mínimo da parcela"), "0,00");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/informe de 1 a 12 parcelas/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejeita mais de 12 parcelas antes da chamada", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<InstallmentSettings initialConfig={null} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText("Máximo de parcelas"), "13");
    await user.type(screen.getByLabelText("Valor mínimo da parcela"), "1,00");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/informe de 1 a 12 parcelas/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
