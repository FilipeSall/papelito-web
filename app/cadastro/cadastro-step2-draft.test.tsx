import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CadastroEtapa2Page from "./etapa-2/page";
import {
  CADASTRO_STEP2_DRAFT_KEY,
  CADASTRO_STEP1_ERROR_KEY,
  CADASTRO_STORAGE_KEY,
  type CadastroStep1Data,
  type CadastroStep2Draft,
} from "./shared";

const { routerMock } = vi.hoisted(() => ({
  routerMock: { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/features/checkout/services/lookup-cep", () => ({
  lookupCepDetailed: vi.fn().mockResolvedValue({
    status: "not_found",
    message: "CEP não encontrado.",
  }),
}));

vi.mock("@/lib/validation/brazilian-documents", () => ({
  formatCep: (value: string) => value,
  formatCnpj: (value: string) => value,
  isValidCep: () => true,
  isValidCnpj: () => true,
}));

vi.mock("@/components/auth/atoms", () => ({
  ArrowRightIcon: () => <span />,
  AuthSubmitButton: ({ children }: { children: React.ReactNode }) => (
    <button type="submit">{children}</button>
  ),
}));

vi.mock("@/components/auth/molecules", () => ({
  AuthPasswordField: ({
    id,
    label,
    defaultValue,
  }: {
    id: string;
    label: string;
    defaultValue?: string;
  }) => (
    <label htmlFor={id}>
      {label}
      <input id={id} name={id} type="password" defaultValue={defaultValue} />
    </label>
  ),
  AuthSelectField: ({
    id,
    label,
    value,
    onChange,
    children,
  }: {
    id: string;
    label: string;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
    children: React.ReactNode;
  }) => (
    <label htmlFor={id}>
      {label}
      <select id={id} name={id} value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  ),
  AuthTextField: ({
    id,
    label,
    value,
    defaultValue,
    onChange,
  }: {
    id: string;
    label: string;
    value?: string;
    defaultValue?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
  }) => (
    <label htmlFor={id}>
      {label}
      <input id={id} name={id} value={value} defaultValue={defaultValue} onChange={onChange} />
    </label>
  ),
}));

const step1: CadastroStep1Data = {
  birthDate: "1990-01-01",
  cnpj: "65.326.368/0001-90",
  cpf: "529.982.247-25",
  name: "Nome de Teste",
  email: "teste@example.test",
  phone: "11999999999",
  intent: "create_company",
};

const step2Draft: CadastroStep2Draft = {
  cep: "70789-060",
  street: "Quadra SQN 416 Bloco F",
  number: "108",
  complement: "apt",
  neighborhood: "Asa Norte",
  city: "Brasília",
  state: "DF",
};

describe("Cadastro etapa 2 — rascunho ao sair da página", () => {
  beforeEach(() => {
    routerMock.push.mockReset();
    routerMock.replace.mockReset();
    window.sessionStorage.clear();
    window.sessionStorage.setItem(CADASTRO_STORAGE_KEY, JSON.stringify(step1));
  });

  afterEach(() => {
    cleanup();
  });

  it("restaura os dados salvos ao reabrir a etapa 2", () => {
    window.sessionStorage.setItem(CADASTRO_STEP2_DRAFT_KEY, JSON.stringify(step2Draft));

    render(<CadastroEtapa2Page />);

    expect(screen.getByLabelText("CEP")).toHaveValue(step2Draft.cep);
    expect(screen.getByLabelText("Logradouro")).toHaveValue(step2Draft.street);
    expect(screen.getByLabelText("Número")).toHaveValue(step2Draft.number);
  });

  it("salva os campos preenchidos sem gravar a senha", () => {
    const view = render(<CadastroEtapa2Page />);

    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: step2Draft.cep } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-secreta" } });

    view.unmount();

    const saved = JSON.parse(
      window.sessionStorage.getItem(CADASTRO_STEP2_DRAFT_KEY) ?? "{}",
    ) as Record<string, string>;
    expect(saved.cep).toBe(step2Draft.cep);
    expect(saved.password).toBeUndefined();
  });

  it("retorna à etapa 1 quando a API informa erro de identidade", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { errors: { cpf: ["Informe um CPF válido."] } },
          }),
          { status: 422 },
        ),
      ),
    );

    render(<CadastroEtapa2Page />);

    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: step2Draft.cep } });
    fireEvent.change(screen.getByLabelText("Logradouro"), { target: { value: step2Draft.street } });
    fireEvent.change(screen.getByLabelText("Número"), { target: { value: step2Draft.number } });
    fireEvent.change(screen.getByLabelText("Bairro"), { target: { value: step2Draft.neighborhood } });
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: step2Draft.city } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: step2Draft.state } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-secreta" } });
    fireEvent.change(screen.getByLabelText("Confirmar Senha"), { target: { value: "senha-secreta" } });
    fireEvent.click(screen.getByRole("button", { name: "Aceitar termos" }));
    fireEvent.submit(screen.getByRole("button", { name: /enviar candidatura/i }).closest("form")!);

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith("/cadastro");
    });

    expect(JSON.parse(window.sessionStorage.getItem(CADASTRO_STEP1_ERROR_KEY) ?? "{}")).toEqual({
      cpf: "Informe um CPF válido.",
    });
  });
});
