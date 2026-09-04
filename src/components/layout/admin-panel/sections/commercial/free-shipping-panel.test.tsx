import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FreeShippingPanel } from "./free-shipping-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const THRESHOLD = { minimumOrderCents: 9900, zipRanges: [] };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FreeShippingPanel", () => {
  it("mostra a regra vigente como uma sentença só", () => {
    render(
      <FreeShippingPanel
        initialIssues={[]}
        initialThreshold={{
          minimumOrderCents: 9900,
          zipRanges: [{ maxCep: "70999999", minCep: "70000000" }],
        }}
      />,
    );

    expect(screen.getByText(/frete grátis a partir de/i)).toBeInTheDocument();
    expect(screen.getByText("1 região")).toBeInTheDocument();
  });

  it("diz que sem faixa o benefício vale para todo o Brasil", () => {
    render(<FreeShippingPanel initialIssues={[]} initialThreshold={THRESHOLD} />);

    expect(screen.getByText("todo o Brasil")).toBeInTheDocument();
    expect(screen.getByText(/sem restrição regional/i)).toBeInTheDocument();
  });

  it("recusa valor mínimo inválido antes de chamar a API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<FreeShippingPanel initialIssues={[]} initialThreshold={THRESHOLD} />);

    const input = screen.getByLabelText(/subtotal mínimo/i);
    await user.clear(input);
    await user.type(input, "0");
    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(screen.getByText(/valor monetário positivo/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aplica máscara na exibição e envia oito dígitos ao backend", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        minimumOrderCents: 9900,
        zipRanges: [{ maxCep: "70999999", minCep: "70000000" }],
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<FreeShippingPanel initialIssues={[]} initialThreshold={THRESHOLD} />);

    await user.click(screen.getByRole("button", { name: /adicionar faixa/i }));
    await user.type(screen.getByLabelText(/cep inicial/i), "70000000");
    await user.type(screen.getByLabelText(/cep final/i), "70999999");

    expect(screen.getByLabelText(/cep inicial/i)).toHaveValue("70000-000");

    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/shipping/free-shipping-threshold", {
      body: JSON.stringify({
        minimumOrderCents: 9900,
        zipRanges: [{ maxCep: "70999999", minCep: "70000000" }],
      }),
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      method: "PUT",
    });
  });

  it("impede CEP inicial maior que o final sem chamar a API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<FreeShippingPanel initialIssues={[]} initialThreshold={THRESHOLD} />);

    await user.click(screen.getByRole("button", { name: /adicionar faixa/i }));
    await user.type(screen.getByLabelText(/cep inicial/i), "80000000");
    await user.type(screen.getByLabelText(/cep final/i), "70000000");
    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/maior ou igual ao inicial/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa faixa incompleta", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<FreeShippingPanel initialIssues={[]} initialThreshold={THRESHOLD} />);

    await user.click(screen.getByRole("button", { name: /adicionar faixa/i }));
    await user.type(screen.getByLabelText(/cep inicial/i), "7000");
    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/oito dígitos/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("remove uma faixa da lista", async () => {
    const user = userEvent.setup();

    render(
      <FreeShippingPanel
        initialIssues={[]}
        initialThreshold={{
          minimumOrderCents: 9900,
          zipRanges: [
            { maxCep: "70999999", minCep: "70000000" },
            { maxCep: "05999999", minCep: "01000000" },
          ],
        }}
      />,
    );

    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /remover faixa 1/i }));

    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
  });
});
