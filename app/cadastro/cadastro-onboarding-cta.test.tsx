import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  formatCpf: (value: string) => {
    if (value === "cpf-valid") return value;
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  },
}));

// Componentes de auth/social podem depender de next-auth; simplificamos para o teste do CTA.
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
    error,
    id,
    label,
    name,
    onChange,
    maxLength,
    value,
    defaultValue,
  }: {
    error?: string;
    id: string;
    label: string;
    name: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    maxLength?: number;
    value?: string;
    defaultValue?: string;
  }) => (
    <label htmlFor={id}>
      {label}
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        defaultValue={defaultValue}
        id={id}
        maxLength={maxLength}
        name={name}
        onChange={onChange}
        value={value}
      />
      {error ? <span id={`${id}-error`}>{error}</span> : null}
    </label>
  ),
}));

describe("Cadastro — CTA de onboarding B2B", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("oferece cadastro de nova empresa e orienta convite para colaboradores", () => {
    render(<CadastroPage />);
    expect(screen.getByText(/você será o titular da empresa cadastrada/i)).toBeInTheDocument();
    expect(screen.getByText(/convidar sua equipe por e-mail/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /entrar em uma empresa/i })).not.toBeInTheDocument();
  });

  it("exibe CNPJ na etapa 1 para o titular da empresa", () => {
    render(<CadastroPage />);
    expect(screen.getByLabelText(/CNPJ da empresa/i)).toBeInTheDocument();
  });

  it("mascara o CPF e descarta letras ou caracteres além do limite", () => {
    render(<CadastroPage />);

    const cpf = screen.getByLabelText(/^cpf$/i) as HTMLInputElement;
    fireEvent.change(cpf, { target: { value: "abc123456789012345" } });

    expect(cpf).toHaveValue("123.456.789-01");
    expect(cpf).toHaveAttribute("maxLength", "14");
  });

  it("não oferece solicitação de acesso por CNPJ na etapa 1", () => {
    render(<CadastroPage />);
    expect(screen.queryByText(/solicite acesso a uma empresa existente/i)).not.toBeInTheDocument();
  });

  it("avança para a segunda etapa quando os dados são válidos", () => {
    render(<CadastroPage />);

    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: "Nome de Teste" } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: "teste@example.test" } });
    fireEvent.change(screen.getByLabelText(/^telefone$/i), { target: { value: "11999999999" } });
    fireEvent.change(screen.getByLabelText(/^cpf$/i), { target: { value: "cpf-valid" } });
    fireEvent.change(screen.getByLabelText(/CNPJ da empresa/i), { target: { value: "cnpj-valid" } });
    fireEvent.change(screen.getByLabelText(/data de nascimento/i), { target: { value: "1990-01-01" } });
    fireEvent.submit(screen.getByRole("button", { name: /próximo/i }).closest("form")!);

    expect(pushMock).toHaveBeenCalledWith("/cadastro/etapa-2");
  });

  it("exibe todos os erros por campo e foca o primeiro campo inválido", async () => {
    render(<CadastroPage />);

    fireEvent.submit(screen.getByRole("button", { name: /próximo/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/revise os campos destacados/i);
    });

    expect(screen.getAllByText("Informe seu nome completo.")).toHaveLength(2);
    expect(screen.getAllByText("Informe seu e-mail.")).toHaveLength(2);
    expect(screen.getAllByText("Informe seu telefone.")).toHaveLength(2);
    expect(screen.getAllByText("Informe um CPF válido.")).toHaveLength(2);
    expect(screen.getAllByText("Informe um CNPJ válido.")).toHaveLength(2);
    expect(screen.getAllByText("Informe sua data de nascimento.")).toHaveLength(2);
    expect(screen.getByLabelText(/nome completo/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/nome completo/i)).toHaveAttribute("aria-describedby", "name-error");
    expect(document.activeElement).toBe(screen.getByLabelText(/nome completo/i));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("explica quando um documento bloqueia o avanço", () => {
    render(<CadastroPage />);

    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: "Nome de Teste" } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: "teste@example.test" } });
    fireEvent.change(screen.getByLabelText(/^telefone$/i), { target: { value: "11999999999" } });
    fireEvent.change(screen.getByLabelText(/^cpf$/i), { target: { value: "invalid" } });
    fireEvent.change(screen.getByLabelText(/CNPJ da empresa/i), { target: { value: "cnpj-valid" } });
    fireEvent.change(screen.getByLabelText(/data de nascimento/i), { target: { value: "1990-01-01" } });
    fireEvent.submit(screen.getByRole("button", { name: /próximo/i }).closest("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent(/cpf válido/i);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
