import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { VendorCreateLauncher } from "./vendor-create-launcher";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

function criarButton() {
  return screen.getByRole("button", { name: "Criar vendor" });
}

function campoDeTexto(label: string) {
  const field = screen.getAllByLabelText(label).find((element) => element instanceof HTMLInputElement);

  if (!field) {
    throw new Error(`Campo não encontrado: ${label}`);
  }

  return field;
}

describe("VendorCreateLauncher — gate do botão", () => {
  it("mantém o botão desabilitado com o formulário vazio", () => {
    render(<VendorCreateLauncher initialOpen />);

    expect(criarButton()).toBeDisabled();
  });

  it("diz qual campo essencial está faltando", () => {
    render(<VendorCreateLauncher initialOpen />);

    expect(screen.getByText(/Informe um e-mail válido\./)).toBeInTheDocument();
  });

  it("avança a pendência conforme os campos são preenchidos", async () => {
    const user = userEvent.setup();
    render(<VendorCreateLauncher initialOpen />);

    const [emailDaConta] = screen.getAllByLabelText(/^E-mail/);
    await user.type(emailDaConta, "vendor@teste.com");

    expect(screen.queryByText(/Informe um e-mail válido\./)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Informe uma senha temporária para o vendor\./),
    ).toBeInTheDocument();
    expect(criarButton()).toBeDisabled();
  });

  it("preenche o endereço do responsável a partir do CEP", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          bairro: "Bela Vista",
          localidade: "São Paulo",
          logradouro: "Avenida Paulista",
          uf: "SP",
        }),
        ok: true,
      }),
    );
    render(<VendorCreateLauncher initialOpen />);

    await user.type(screen.getByLabelText("CEP do responsável"), "01310930");

    await waitFor(() => {
      expect(screen.getByLabelText("Rua do responsável")).toHaveValue("Avenida Paulista");
    });

    expect(campoDeTexto("Bairro")).toHaveValue("Bela Vista");
    expect(campoDeTexto("Cidade")).toHaveValue("São Paulo");
    expect(screen.getByRole("button", { name: "São Paulo" })).toBeInTheDocument();
  });
});

function campoPorRotulo(rotulo: string) {
  const label = screen.getAllByText(rotulo).map((element) => element.closest("label")).find(Boolean);
  const input = label?.querySelector("input");

  if (!input) {
    throw new Error(`Campo não encontrado: ${rotulo}`);
  }

  return input;
}

function erroDoCampo(input: HTMLInputElement) {
  const spans = Array.from(input.closest("label")?.querySelectorAll("span") ?? []);

  return spans.find((span) => span.textContent?.includes("dígitos verificadores"))?.textContent ?? null;
}

describe("VendorCreateLauncher — dígitos verificadores do documento", () => {
  it("não acusa erro enquanto o CNPJ ainda está incompleto", async () => {
    const user = userEvent.setup();
    render(<VendorCreateLauncher initialOpen />);

    const cnpj = campoPorRotulo("CNPJ *");
    await user.type(cnpj, "6532636800");

    expect(erroDoCampo(cnpj)).toBeNull();
  });

  it("acusa CNPJ com dígito verificador fabricado, no campo e no titular espelhado", async () => {
    const user = userEvent.setup();
    render(<VendorCreateLauncher initialOpen />);

    const cnpj = campoPorRotulo("CNPJ *");
    await user.type(cnpj, "65326368000191");

    expect(erroDoCampo(cnpj)).toBe("CNPJ inválido: os dígitos verificadores não conferem.");
    expect(erroDoCampo(campoPorRotulo("CNPJ do titular"))).toBe(
      "CNPJ inválido: os dígitos verificadores não conferem.",
    );
  });

  it("aceita CNPJ com dígito verificador correto", async () => {
    const user = userEvent.setup();
    render(<VendorCreateLauncher initialOpen />);

    const cnpj = campoPorRotulo("CNPJ *");
    await user.type(cnpj, "65326368000190");

    expect(cnpj).toHaveValue("65.326.368/0001-90");
    expect(erroDoCampo(cnpj)).toBeNull();
  });

  it("bloqueia o submit enquanto o CNPJ não fecha o dígito verificador", () => {
    render(<VendorCreateLauncher initialOpen />);

    const [emailDaConta] = screen.getAllByLabelText(/^E-mail/);
    fireEvent.change(emailDaConta, { target: { value: "vendor@teste.com" } });
    fireEvent.change(campoPorRotulo("Senha temporária *"), { target: { value: "senha-temporaria-1" } });
    fireEvent.change(campoPorRotulo("Nome da loja *"), { target: { value: "Papelaria Teste" } });
    fireEvent.change(campoPorRotulo("CNPJ *"), { target: { value: "65326368000191" } });

    expect(screen.getByText(/Informe um CNPJ válido\./)).toBeInTheDocument();
    expect(criarButton()).toBeDisabled();
  });
});
