import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FreeShippingPanel } from "./free-shipping-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const THRESHOLD = { minimumOrderCents: 9900, zipRanges: [] };

/** Faixas oficiais do DF no módulo compartilhado: a UF é a única com duas faixas na Região Centro-Oeste. */
const DF_RANGES = [
  { maxCep: "72799999", minCep: "70000000" },
  { maxCep: "73699999", minCep: "73000000" },
];

async function addManualScope(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /adicionar abrangência/i }));

  const rows = within(screen.getByRole("list")).getAllByRole("listitem");
  await user.click(within(rows.at(-1)!).getByRole("button", { name: /^faixa manual$/i }));
}

/** O tipo aparece como selo e como botão do alternador; o selo é o span, e é o que a tela comunica. */
function scopeBadge(row: HTMLElement, label: string) {
  return within(row).getByText(label, { selector: "span" });
}

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

    await addManualScope(user);
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

    await addManualScope(user);
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

    await addManualScope(user);
    await user.type(screen.getByLabelText(/cep inicial/i), "7000");
    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/oito dígitos/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("remove uma abrangência da lista", async () => {
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

    await user.click(screen.getByRole("button", { name: /remover abrangência 1/i }));

    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
  });

  it("envia as faixas oficiais da região escolhida", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ minimumOrderCents: 9900, zipRanges: DF_RANGES }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<FreeShippingPanel initialIssues={[]} initialThreshold={THRESHOLD} />);

    await user.click(screen.getByRole("button", { name: /adicionar abrangência/i }));
    await user.selectOptions(screen.getByLabelText("Região"), "DF");

    expect(screen.getByText(/70000-000 a 72799-999 \| 73000-000 a 73699-999/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/shipping/free-shipping-threshold", {
      body: JSON.stringify({ minimumOrderCents: 9900, zipRanges: DF_RANGES }),
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      method: "PUT",
    });
  });

  it("reconhece faixas já salvas que formam uma região pronta", () => {
    render(
      <FreeShippingPanel
        initialIssues={[]}
        initialThreshold={{ minimumOrderCents: 9900, zipRanges: DF_RANGES }}
      />,
    );

    expect(screen.getByText(/abrangência salva: distrito federal/i)).toBeInTheDocument();
    expect(screen.getByText("1 região")).toBeInTheDocument();

    const row = within(screen.getByRole("list")).getByRole("listitem");
    expect(scopeBadge(row, "Região pronta")).toBeInTheDocument();
    expect(screen.getByLabelText("Região")).toHaveValue("DF");
  });

  it("mantém faixa salva fora de qualquer região como manual e editável", () => {
    render(
      <FreeShippingPanel
        initialIssues={[]}
        initialThreshold={{
          minimumOrderCents: 9900,
          zipRanges: [{ maxCep: "71599999", minCep: "71500000" }],
        }}
      />,
    );

    const row = within(screen.getByRole("list")).getByRole("listitem");
    expect(scopeBadge(row, "Faixa manual")).toBeInTheDocument();
    expect(screen.getByLabelText(/cep inicial/i)).toHaveValue("71500-000");
    expect(screen.getByLabelText(/cep final/i)).toHaveValue("71599-999");
  });

  it("recusa a mesma região em duas abrangências", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<FreeShippingPanel initialIssues={[]} initialThreshold={THRESHOLD} />);

    await user.click(screen.getByRole("button", { name: /adicionar abrangência/i }));
    await user.click(screen.getByRole("button", { name: /adicionar abrangência/i }));

    const selects = screen.getAllByLabelText("Região");
    await user.selectOptions(selects[0], "SP");
    await user.selectOptions(selects[1], "SP");
    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/já está na abrangência 1/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa abrangência de região sem região escolhida", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<FreeShippingPanel initialIssues={[]} initialThreshold={THRESHOLD} />);

    await user.click(screen.getByRole("button", { name: /adicionar abrangência/i }));
    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/selecione uma região/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("avisa quando uma região se sobrepõe a uma faixa manual", async () => {
    const user = userEvent.setup();

    render(<FreeShippingPanel initialIssues={[]} initialThreshold={THRESHOLD} />);

    await user.click(screen.getByRole("button", { name: /adicionar abrangência/i }));
    await user.selectOptions(screen.getByLabelText("Região"), "SP");

    await addManualScope(user);
    await user.type(screen.getByLabelText(/cep inicial/i), "01000000");
    await user.type(screen.getByLabelText(/cep final/i), "01999999");

    expect(screen.getByText(/se sobrepõem/i)).toBeInTheDocument();
  });

  it("troca de região pronta para faixa manual sem herdar o CEP da região", async () => {
    const user = userEvent.setup();

    render(
      <FreeShippingPanel
        initialIssues={[]}
        initialThreshold={{ minimumOrderCents: 9900, zipRanges: DF_RANGES }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^faixa manual$/i }));

    expect(screen.getByLabelText(/cep inicial/i)).toHaveValue("");
    expect(screen.queryByLabelText("Região")).not.toBeInTheDocument();
  });
});
