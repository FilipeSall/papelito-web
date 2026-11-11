import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../../test/msw/server";
import { CnpjScreen } from "./cnpj-screen";

const VALID_CNPJ = "11222333000181";

const STORE = {
  cnpj: VALID_CNPJ,
  legalName: "Tabacaria Exemplo LTDA",
  tradeName: "Tabacaria Exemplo",
  address: { cep: "01001000", street: "Praça da Sé", city: "São Paulo", state: "SP", number: "", neighborhood: "" },
  companyId: null,
};

async function typeDigits(user: ReturnType<typeof userEvent.setup>, digits: string) {
  for (const digit of digits) {
    await user.click(screen.getByRole("button", { name: digit }));
  }
}

describe("CnpjScreen", () => {
  it("não perde dígito em toques rápidos", () => {
    render(<CnpjScreen onConfirm={vi.fn()} />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "1" }));
      fireEvent.click(screen.getByRole("button", { name: "2" }));
      fireEvent.click(screen.getByRole("button", { name: "3" }));
    });

    expect(screen.getByLabelText("CNPJ da loja")).toHaveValue("12.3");
  });

  it("avisa quantos números faltam", async () => {
    const user = userEvent.setup();
    render(<CnpjScreen onConfirm={vi.fn()} />);

    await typeDigits(user, "1122233");
    await user.click(screen.getByRole("button", { name: "Buscar loja" }));

    expect(screen.getByText("O CNPJ tem 14 números. Faltam 7.")).toBeInTheDocument();
  });

  it("recusa dígito verificador errado", async () => {
    const user = userEvent.setup();
    render(<CnpjScreen onConfirm={vi.fn()} />);

    await typeDigits(user, "11222333000180");
    await user.click(screen.getByRole("button", { name: "Buscar loja" }));

    expect(screen.getByText("Esse CNPJ não existe. Confere os números com o lojista?")).toBeInTheDocument();
  });

  it("Enter busca e mostra a loja; confirmar inicia o atendimento", async () => {
    server.use(http.post("*/api/expocannabis/buyers/lookup", () => HttpResponse.json(STORE)));
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<CnpjScreen onConfirm={onConfirm} />);

    await user.click(screen.getByLabelText("CNPJ da loja"));
    await user.keyboard(`${VALID_CNPJ}{Enter}`);

    expect(await screen.findByText("Tabacaria Exemplo LTDA")).toBeInTheDocument();
    expect(screen.getByText("CNPJ ativo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "É essa, bora pro pedido" }));
    expect(onConfirm).toHaveBeenCalledWith(STORE);
  });

  it("mostra Tentar de novo quando a busca falha", async () => {
    let calls = 0;
    server.use(
      http.post("*/api/expocannabis/buyers/lookup", () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ code: "papelito_event_cnpj_unavailable", message: "x" }, { status: 503 })
          : HttpResponse.json(STORE);
      }),
    );
    const user = userEvent.setup();
    render(<CnpjScreen onConfirm={vi.fn()} />);

    await typeDigits(user, VALID_CNPJ);
    await user.click(screen.getByRole("button", { name: "Buscar loja" }));

    expect(await screen.findByText("A Receita não respondeu.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("Tabacaria Exemplo LTDA")).toBeInTheDocument();
  });

  it.each([
    ["papelito_event_cnpj_inactive", 422, "Esse CNPJ está inativo na Receita. Não dá pra vender pra ele."],
    ["papelito_event_cnpj_not_found", 404, "Não achamos esse CNPJ na Receita. Confere os números?"],
  ])("traduz %s", async (code, status, message) => {
    server.use(http.post("*/api/expocannabis/buyers/lookup", () => HttpResponse.json({ code, message: "x" }, { status })));
    const user = userEvent.setup();
    render(<CnpjScreen onConfirm={vi.fn()} />);

    await typeDigits(user, VALID_CNPJ);
    await user.click(screen.getByRole("button", { name: "Buscar loja" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
  });

  it("Não é essa volta ao campo vazio", async () => {
    server.use(http.post("*/api/expocannabis/buyers/lookup", () => HttpResponse.json(STORE)));
    const user = userEvent.setup();
    render(<CnpjScreen onConfirm={vi.fn()} />);

    await typeDigits(user, VALID_CNPJ);
    await user.click(screen.getByRole("button", { name: "Buscar loja" }));
    await user.click(await screen.findByRole("button", { name: "Não é essa, corrigir CNPJ" }));

    expect(screen.getByLabelText("CNPJ da loja")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Buscar loja" })).toBeDisabled();
  });
});
