import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CadastroPage from "./page";
import { CADASTRO_STEP1_DRAFT_KEY, CADASTRO_STORAGE_KEY } from "./shared";

const pushMock = vi.fn();
let searchParamsValue = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock("@/lib/validation/brazilian-documents", () => ({
  formatCnpj: (value: string) => value,
  isValidCpf: (value: string) => value === "cpf-valid",
  isValidCnpj: (value: string) => value === "cnpj-valid",
}));

vi.mock("@/features/revendedor/utils/revendedor-registration", () => ({
  formatCpf: (value: string) => value,
}));

vi.mock("@/components/auth/atoms", () => ({
  ArrowRightIcon: () => <span />,
  AuthSocialButton: () => <button type="button">Google</button>,
  AuthSubmitButton: ({ children }: { children: React.ReactNode }) => (
    <button type="submit">{children}</button>
  ),
}));

vi.mock("@/components/auth/molecules", () => ({
  AuthSocialDivider: () => <div />,
  AuthTextField: ({
    id,
    label,
    onChange,
    defaultValue,
  }: {
    id: string;
    label: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    defaultValue?: string;
  }) => (
    <label htmlFor={id}>
      {label}
      <input id={id} name={id} onChange={onChange} defaultValue={defaultValue} />
    </label>
  ),
}));

function fillStep1() {
  fireEvent.change(screen.getByLabelText(/nome completo/i), {
    target: { value: "Nome de Teste" },
  });
  fireEvent.change(screen.getByLabelText(/e-mail/i), {
    target: { value: "teste@example.test" },
  });
  fireEvent.change(screen.getByLabelText(/^telefone$/i), {
    target: { value: "11999999999" },
  });
}

describe("Cadastro etapa 1 — rascunho ao sair da página", () => {
  beforeEach(() => {
    pushMock.mockClear();
    searchParamsValue = "";
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("salva o que foi preenchido quando o usuário sai sem enviar", () => {
    const view = render(<CadastroPage />);
    fillStep1();

    view.unmount();

    const saved = JSON.parse(
      window.sessionStorage.getItem(CADASTRO_STEP1_DRAFT_KEY) ?? "{}",
    );
    expect(saved.name).toBe("Nome de Teste");
    expect(saved.email).toBe("teste@example.test");
    expect(saved.phone).toBe("11999999999");
  });

  it("restaura o rascunho ao voltar para a etapa 1", () => {
    const view = render(<CadastroPage />);
    fillStep1();
    view.unmount();

    render(<CadastroPage />);

    expect(screen.getByLabelText(/nome completo/i)).toHaveValue("Nome de Teste");
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue("teste@example.test");
    expect(screen.getByLabelText(/^telefone$/i)).toHaveValue("11999999999");
  });

  it("preserva o cadastro como titular da nova empresa", () => {
    const view = render(<CadastroPage />);
    fillStep1();
    view.unmount();

    const saved = JSON.parse(window.sessionStorage.getItem(CADASTRO_STEP1_DRAFT_KEY) ?? "{}");
    expect(saved.intent).toBe("create_company");
  });

  it("não grava rascunho quando o formulário está vazio", () => {
    const view = render(<CadastroPage />);
    view.unmount();

    expect(window.sessionStorage.getItem(CADASTRO_STEP1_DRAFT_KEY)).toBeNull();
  });

  it("descarta o rascunho ao concluir a etapa 1", () => {
    render(<CadastroPage />);
    fillStep1();
    fireEvent.change(screen.getByLabelText(/^cpf$/i), { target: { value: "cpf-valid" } });
    fireEvent.change(screen.getByLabelText(/CNPJ da empresa/i), { target: { value: "cnpj-valid" } });
    fireEvent.change(screen.getByLabelText(/data de nascimento/i), {
      target: { value: "1990-01-01" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /próximo/i }).closest("form")!);

    expect(pushMock).toHaveBeenCalledWith("/cadastro/etapa-2");
    expect(window.sessionStorage.getItem(CADASTRO_STEP1_DRAFT_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(CADASTRO_STORAGE_KEY)).not.toBeNull();
  });

  it("um rascunho parcial não libera a etapa 2", () => {
    const view = render(<CadastroPage />);
    fillStep1();
    view.unmount();

    expect(window.sessionStorage.getItem(CADASTRO_STEP1_DRAFT_KEY)).not.toBeNull();
    expect(window.sessionStorage.getItem(CADASTRO_STORAGE_KEY)).toBeNull();
  });

  it("mostra o feedback da conta Google em um toast", () => {
    searchParamsValue = "feedback=google_account_required";

    render(<CadastroPage />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Ainda não encontramos uma conta aprovada para este e-mail Google.",
    );
    fireEvent.click(screen.getByRole("button", { name: /fechar notificação/i }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
