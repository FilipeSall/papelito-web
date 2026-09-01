import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CadastroPage from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/validation/brazilian-documents", () => ({
  formatCnpj: (value: string) => value,
  isValidCpf: (value: string) => value === "cpf-valid",
  isValidCnpj: (value: string) => value === "cnpj-valid",
}));

vi.mock("@/features/revendedor/utils/revendedor-registration", () => ({
  formatCpf: (value: string) => value,
}));

vi.mock("@/components/auth/atoms", async () => {
  const atoms = await vi.importActual<typeof import("@/components/auth/atoms")>(
    "@/components/auth/atoms",
  );

  return {
    ...atoms,
    AuthSocialButton: () => <button type="button">Google</button>,
  };
});

vi.mock("@/components/auth/molecules", () => ({
  AuthSocialDivider: () => <div />,
  AuthTextField: ({
    id,
    name,
    label,
    onChange,
    defaultValue,
  }: {
    id: string;
    name: string;
    label: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    defaultValue?: string;
  }) => (
    <label htmlFor={id}>
      {label}
      <input id={id} name={name} onChange={onChange} defaultValue={defaultValue} />
    </label>
  ),
}));

function fillValidStep1() {
  fireEvent.change(screen.getByLabelText(/nome completo/i), {
    target: { value: "Nome de Teste" },
  });
  fireEvent.change(screen.getByLabelText(/e-mail/i), {
    target: { value: "teste@example.test" },
  });
  fireEvent.change(screen.getByLabelText(/^telefone$/i), {
    target: { value: "11999999999" },
  });
  fireEvent.change(screen.getByLabelText(/^cpf$/i), { target: { value: "cpf-valid" } });
  fireEvent.change(screen.getByLabelText(/CNPJ da empresa/i), {
    target: { value: "cnpj-valid" },
  });
  fireEvent.change(screen.getByLabelText(/data de nascimento/i), {
    target: { value: "1990-01-01" },
  });
}

function submitForm() {
  fireEvent.submit(
    screen.getByRole("button", { name: /próximo|carregando/i }).closest("form")!,
  );
}

describe("Cadastro etapa 1 — feedback de carregamento até a etapa 2", () => {
  beforeEach(() => {
    pushMock.mockClear();
    window.sessionStorage.clear();
  });

  afterEach(cleanup);

  it("o botão vira estado de carregando ao avançar para a etapa 2", () => {
    render(<CadastroPage />);
    fillValidStep1();

    expect(screen.getByRole("button", { name: /próximo/i })).toHaveAttribute(
      "aria-busy",
      "false",
    );

    submitForm();

    const button = screen.getByRole("button", { name: /carregando/i });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(pushMock).toHaveBeenCalledWith("/cadastro/etapa-2");
  });

  it("não avança de novo enquanto a navegação está em curso", () => {
    render(<CadastroPage />);
    fillValidStep1();

    submitForm();
    submitForm();

    expect(pushMock).toHaveBeenCalledTimes(1);
  });

  it("não entra em carregando quando a validação reprova o formulário", () => {
    render(<CadastroPage />);
    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: "Nome de Teste" },
    });

    submitForm();

    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /próximo/i })).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });
});
